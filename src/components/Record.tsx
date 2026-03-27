import {
  AppBskyFeedGenerator as feedGenerator,
  AppBskyGraphBlock as block,
  AppBskyGraphFollow as follow,
  AppBskyFeedLike as like,
  AppBskyGraphList as list,
  ComAtprotoRepoListRecords as listRecords,
  AppBskyFeedPost as post,
  AppBskyActorProfile as profile,
  AppBskyFeedRepost as repost,
  AppBskyGraphStarterpack as starterpack,
} from '@atproto/api'
import { useContext, useEffect, useState } from 'react'
import { Filter } from '../App'
import { LikedRecord, Profile, fetchPost, fetchRecord, fetchProfile } from '../utils/api'
import FeedCard from './FeedCard'
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
  const [value, setValue] = useState<LikedRecord | Profile>()
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
    if (like.isRecord(record.value)) {
      const subject = (record.value as like.Record).subject
      return fetchRecord(
        service,
        subject.uri,
        subject.cid,
        setValue,
        setError,
      )
    } else if (repost.isRecord(record.value)) {
      const subject = (record.value as repost.Record).subject
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

  if (starterpack.isRecord(record.value)) {
    return <FeedCard service={service} uri={record.uri} record={record.value as starterpack.Record} />
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
    if (post.isRecord(value)) {
      return (
        <Post
          verb="liked"
          verbedAt={likeRecord.createdAt}
          service={service}
          uri={likeRecord.subject.uri}
          post={value as post.Record}
        />
      )
    }
    if (
      feedGenerator.isRecord(value) ||
      list.isRecord(value) ||
      starterpack.isRecord(value)
    ) {
      return (
        <FeedCard
          verb="liked"
          verbedAt={likeRecord.createdAt}
          service={service}
          uri={likeRecord.subject.uri}
          record={value as feedGenerator.Record | list.Record | starterpack.Record}
        />
      )
    }
    return (
      <div className="text-center py-4" aria-label="Loading like">
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
      <div className="text-center py-4" aria-label="Loading repost">
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
        className="text-center py-4"
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
      <div className="text-center py-4" aria-label="Loading blocked user">
        <Spinner />
      </div>
    )
  } else {
    return null
  }
}
