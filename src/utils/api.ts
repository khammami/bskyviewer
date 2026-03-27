import {
  AppBskyActorProfile,
  AppBskyFeedGenerator,
  AppBskyFeedPost,
  AppBskyGraphList,
  AppBskyGraphStarterpack,
  AtUri,
  AtpAgent,
  BlobRef,
} from '@atproto/api'
import memoize from 'fast-memoize'

export const getBlobURL = memoize(
  (service: string, did: string, ref: BlobRef) => {
    return `${service}/xrpc/com.atproto.sync.getBlob?${new URLSearchParams({
      did,
      cid: ref.ref,
    }).toString()}`
  },
)

export async function fetchPosts({
  service,
  handle,
  cursor,
  collection,
}: {
  service: string
  handle: string
  cursor?: string
  collection: string
}) {
  const agent = new AtpAgent({ service })
  const { data } = await agent.api.com.atproto.repo.listRecords({
    repo: handle,
    collection,
    limit: 5,
    cursor,
  })
  return data
}

const MAX_CACHE_SIZE = 500

function limitedSet<V>(map: Map<string, V>, key: string, value: V) {
  if (map.size >= MAX_CACHE_SIZE) {
    const oldest = map.keys().next().value!
    map.delete(oldest)
  }
  map.set(key, value)
}

const _getRecordCache = new Map<string, Promise<any>>()
const getRecord = (service: string, args: any) => {
  const key = JSON.stringify([service, args])
  const cached = _getRecordCache.get(key)
  if (cached) return cached
  const agent = new AtpAgent({ service })
  const promise = agent.api.com.atproto.repo.getRecord(args)
  limitedSet(_getRecordCache, key, promise)
  promise.catch(() => _getRecordCache.delete(key))
  return promise
}

const _describeRepoCache = new Map<string, Promise<any>>()
const describeRepo = (service: string, args: any) => {
  const key = JSON.stringify([service, args])
  const cached = _describeRepoCache.get(key)
  if (cached) return cached
  const agent = new AtpAgent({ service })
  const promise = agent.api.com.atproto.repo.describeRepo(args)
  limitedSet(_describeRepoCache, key, promise)
  promise.catch(() => _describeRepoCache.delete(key))
  return promise
}

export type Profile = {
  uri: string
  handle: string
  profile: AppBskyActorProfile.Record
}

export const fetchProfile = function fetchProfile(
  service: string,
  handle: string,
  onSuccess: (profile: Profile) => void,
  onError: (error: string) => void,
) {
  const abortController = new AbortController()

  describeRepo(service, {
    repo: handle,
  })
    .then(({ data: { handle } }) => {
      if (abortController.signal.aborted) {
        return
      }
      getRecord(service, {
        repo: handle,
        collection: 'app.bsky.actor.profile',
        rkey: 'self',
      }).then(({ data: { uri, value } }) => {
        if (abortController.signal.aborted) {
          return
        }

        if (AppBskyActorProfile.isRecord(value)) {
          onSuccess({ uri, handle, profile: value as AppBskyActorProfile.Record })
          return { uri, value }
        } else if (!abortController.signal.aborted) {
          onError(`Invalid profile record ${uri}`)
        }
      })
    })
    .catch(
      (error) =>
        abortController.signal.aborted ||
        onError(error?.message ?? String(error)),
    )

  return () => {
    abortController.abort()
  }
}

export type LikedRecord =
  | AppBskyFeedPost.Record
  | AppBskyFeedGenerator.Record
  | AppBskyGraphList.Record
  | AppBskyGraphStarterpack.Record

export function fetchRecord(
  service: string,
  uri: string,
  cid: string,
  onSuccess: (record: LikedRecord) => void,
  onError: (error: string) => void,
) {
  const atUri = new AtUri(uri)

  const abortController = new AbortController()

  getRecord(service, {
    repo: atUri.hostname,
    collection: atUri.collection,
    rkey: atUri.rkey,
    cid: cid,
  })
    .then(({ data: { value } }) => {
      if (!abortController.signal.aborted) {
        if (
          AppBskyFeedPost.isRecord(value) ||
          AppBskyFeedGenerator.isRecord(value) ||
          AppBskyGraphList.isRecord(value) ||
          AppBskyGraphStarterpack.isRecord(value)
        ) {
          onSuccess(value as LikedRecord)
        } else {
          console.log(value)
          onError(`Unsupported record type ${uri}`)
        }
      }
    })
    .catch(
      (error) =>
        abortController.signal.aborted ||
        onError(error?.message || String(error)),
    )

  return () => {
    abortController.abort()
  }
}

export function fetchPost(
  service: string,
  uri: string,
  cid: string,
  onSuccess: (post: AppBskyFeedPost.Record) => void,
  onError: (error: string) => void,
) {
  const atUri = new AtUri(uri)

  const abortController = new AbortController()

  getRecord(service, {
    repo: atUri.hostname,
    collection: atUri.collection,
    rkey: atUri.rkey,
    cid: cid,
  })
    .then(({ data: { value } }) => {
      if (!abortController.signal.aborted) {
        if (AppBskyFeedPost.isRecord(value)) {
          onSuccess(value as AppBskyFeedPost.Record)
        } else {
          console.log(value)
          onError(`Invalid post record ${uri}`)
        }
      }
    })
    .catch(
      (error) =>
        abortController.signal.aborted ||
        onError(error?.message || String(error)),
    )

  return () => {
    abortController.abort()
  }
}
