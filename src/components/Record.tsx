import {
  AppBskyGraphBlock as block,
  AppBskyGraphFollow as follow,
  AppBskyFeedLike as like,
  ComAtprotoRepoListRecords as listRecords,
  AppBskyFeedPost as post,
  AppBskyActorProfile as profile,
  AppBskyFeedRepost as repost,
} from '@atproto/api'
import { useContext, useEffect, useState } from 'react'
import { Filter } from '../App'
import { Profile, fetchPost, fetchProfile } from '../utils/api'
import FriendlyError from './FriendlyError'
import Post from './Post'
import Spinner from './Spinner'
import User from './User'

export function Record({
  service,
  record,
}: {
  service: string
  record: listRecords.Record
}) {
  const [value, setValue] = useState<post.Record | Profile>()
  const [error, setError] = useState('')
  const [filter] = useContext(Filter)
  useEffect(() => {
    if (
      post.isRecord(record.value) ||
      profile.isRecord(record.value) ||
      !('subject' in record.value)
    ) {
      return
    }
    if (like.isRecord(record.value) || repost.isRecord(record.value)) {
      return fetchPost(
        service,
        record.value.subject.uri,
        record.value.subject.cid,
        setValue,
        setError,
      )
    } else if (follow.isRecord(record.value) || block.isRecord(record.value)) {
      return fetchProfile(service, record.value.subject, setValue, setError)
    }
  }, [service, record])

  if (post.isRecord(record.value)) {
    return filter.contains(record.uri) ? null : <Post service={service} uri={record.uri} post={record.value} />
  }

  if (
    error ||
    record.error ||
    !record.value ||
    !('$type' in record.value) ||
    !record.value['$type']
  ) {
    return (
      <FriendlyError
        heading="Error fetching the post"
        message={error || String(record.error)}
      />
    )
  }

  if (like.isRecord(record.value)) {
    return post.isRecord(value) ? (
      <Post
        verb="liked"
        verbedAt={record.value.createdAt}
        service={service}
        uri={record.value.subject.uri}
        post={value}
      />
    ) : (
      <div className="App__post-loading-card" aria-label="Loading like">
        <Spinner />
      </div>
    )
  } else if (repost.isRecord(record.value)) {
    return post.isRecord(value) ? (
      <Post
        verb="shared"
        verbedAt={record.value.createdAt}
        service={service}
        uri={record.value.subject.uri}
        post={value}
      />
    ) : (
      <div className="App__post-loading-card" aria-label="Loading repost">
        <Spinner />
      </div>
    )
  } else if (follow.isRecord(record.value)) {
    return value && profile.isRecord(value.profile) ? (
      <User
        verb="followed"
        verbedAt={record.value.createdAt}
        service={service}
        profile={value as Profile}
      />
    ) : (
      <div
        className="App__post-loading-card"
        aria-label="Loading followed user"
      >
        <Spinner />
      </div>
    )
  } else if (block.isRecord(record.value)) {
    return value && profile.isRecord(value.profile) ? (
      <User
        verb="blocked"
        verbedAt={record.value.createdAt}
        service={service}
        profile={value as Profile}
      />
    ) : (
      <div className="App__post-loading-card" aria-label="Loading blocked user">
        <Spinner />
      </div>
    )
  } else {
    return null
  }
}
