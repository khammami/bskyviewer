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
      const subject = (record.value as like.Record).subject
      return fetchPost(
        service,
        subject.uri,
        subject.cid,
        setValue,
        setError,
      )
    } else if (follow.isRecord(record.value) || block.isRecord(record.value)) {
      return fetchProfile(service, (record.value as follow.Record).subject, setValue, setError)
    }
  }, [service, record])

  if (post.isRecord(record.value)) {
    return filter.contains(record.uri) ? null : <Post service={service} uri={record.uri} post={record.value as post.Record} />
  }

  if (
    error ||
    !record.value ||
    !('$type' in record.value) ||
    !record.value['$type']
  ) {
    return (
      <FriendlyError
        heading="Error fetching the post"
        message={error}
      />
    )
  }

  if (like.isRecord(record.value)) {
    const likeRecord = record.value as like.Record
    return post.isRecord(value) ? (
      <Post
        verb="liked"
        verbedAt={likeRecord.createdAt}
        service={service}
        uri={likeRecord.subject.uri}
        post={value as post.Record}
      />
    ) : (
      <div className="App__post-loading-card" aria-label="Loading like">
        <Spinner />
      </div>
    )
  } else if (repost.isRecord(record.value)) {
    const repostRecord = record.value as repost.Record
    return post.isRecord(value) ? (
      <Post
        verb="shared"
        verbedAt={repostRecord.createdAt}
        service={service}
        uri={repostRecord.subject.uri}
        post={value as post.Record}
      />
    ) : (
      <div className="App__post-loading-card" aria-label="Loading repost">
        <Spinner />
      </div>
    )
  } else if (follow.isRecord(record.value)) {
    const followRecord = record.value as follow.Record
    return value && profile.isRecord(value.profile) ? (
      <User
        verb="followed"
        verbedAt={followRecord.createdAt}
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
    const blockRecord = record.value as block.Record
    return value && profile.isRecord(value.profile) ? (
      <User
        verb="blocked"
        verbedAt={blockRecord.createdAt}
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
