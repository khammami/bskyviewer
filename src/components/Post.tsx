import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedPost,
  AtUri,
} from '@atproto/api'
import classNames from 'classnames'
import { useEffect, useMemo, useState } from 'react'
import { renderToString } from 'react-dom/server'
import { ReactEmbed } from 'react-embed'
import { Profile, fetchPost, fetchProfile, getBlobURL } from '../utils/api'
import { WEB_APP } from '../utils/constants'
import { getRelativeDateString } from '../utils/datetime'
import FriendlyError from './FriendlyError'
import './Post.css'
import RichText from './RichText'
import User from './User'

function ExternalEmbed({
  service,
  did,
  embed,
}: {
  service: string
  did: string
  embed: AppBskyEmbedExternal.External
}) {
  return (
    <ReactEmbed
      url={embed.uri}
      renderVoid={() =>
        embed.thumb ? (
          <a href={embed.uri} target="_blank" className="Post__external-embed">
            <img
              className="Post__image"
              src={getBlobURL(service, did, embed.thumb)}
              alt={embed.title}
            />
            <span className="Post__external-embed-title">{embed.title}</span>
            <br />
            <span className="Post__external-embed-description">
              {embed.description}
            </span>
          </a>
        ) : null
      }
    />
  )
}

function PostImages({
  service,
  did,
  images,
}: {
  service: string
  did: string
  images: AppBskyEmbedImages.Image[]
}) {
  if (images.length === 1) {
    const url = getBlobURL(service, did, images[0].image)
    return (
      <img
        className="Post__image"
        src={url}
        alt={images[0].alt}
        data-tooltip-id="image"
        data-tooltip-content={url}
      />
    )
  }

  return (
    <div className="Post__images">
      {images.map((image, idx) => {
        const url = getBlobURL(service, did, image.image)
        return (
          <img
            key={idx}
            src={url}
            alt={image.alt}
            data-tooltip-id="image"
            data-tooltip-content={url}
          />
        )
      })}
    </div>
  )
}

function Post({
  service,
  className,
  uri,
  post,
  verb,
  verbedAt,
  isEmbedded = false,
}: {
  service: string
  className?: string
  uri: string
  post: AppBskyFeedPost.Record
  verb?: string
  verbedAt?: string
  isEmbedded?: boolean
}) {
  const atUri = useMemo(() => new AtUri(uri), [uri])

  const [profile, setProfile] = useState<Profile>()

  const [profileError, setProfileError] = useState<string>()

  const [embeddedPost, setEmbeddedPost] = useState<{
    uri: string
    record: AppBskyFeedPost.Record
  }>()

  const [embeddedPostError, setEmbeddedPostError] = useState<string>()

  const [parentPost, setParentPost] = useState<AppBskyFeedPost.Record>()

  const [parentPostError, setParentPostError] = useState<string>()

  const profileImage = useMemo(() => {
    if (!profile) {
      return null
    }

    if (!profile.profile.avatar) {
      return null
    }

    return getBlobURL(service, atUri.hostname, profile.profile.avatar)
  }, [atUri.hostname, profile, service])

  const profileHtml = useMemo(
    () =>
      profile && renderToString(<User service={service} profile={profile} />),
    [profile, service],
  )

  const [date, relativeDate] = useMemo(() => {
    const date = new Date(post.createdAt)
    if (verb && verbedAt) {
      return [
        date,
        `${getRelativeDateString(date)} (${verb} ${getRelativeDateString(
          new Date(verbedAt),
        )})`,
      ]
    }
    return [date, getRelativeDateString(date)]
  }, [post.createdAt, verb, verbedAt])

  useEffect(() => {
    if (isEmbedded || !post.reply) {
      return
    }

    return fetchPost(
      service,
      post.reply.parent.uri,
      post.reply.parent.cid,
      setParentPost,
      setParentPostError,
    )
  }, [isEmbedded, post.reply, service])

  useEffect(
    () => fetchProfile(service, atUri.hostname, setProfile, setProfileError),
    [atUri.hostname, service],
  )

  useEffect(() => {
    if (isEmbedded) {
      return
    }

    if (
      !AppBskyEmbedRecord.isMain(post.embed) &&
      !AppBskyEmbedRecordWithMedia.isMain(post.embed)
    ) {
      return
    }
    const record = AppBskyEmbedRecord.isMain(post.embed)
      ? post.embed.record
      : post.embed.record.record

    return fetchPost(
      service,
      record.uri,
      record.cid,
      (data) => setEmbeddedPost({ uri: record.uri, record: data }),
      setEmbeddedPostError,
    )
  }, [isEmbedded, post.embed, service])

  const postNode = (
    <article
      className={classNames('Post', isEmbedded && 'Post--embed', className)}
    >
      {profileImage ? (
        <img
          className="Post__avatar"
          src={profileImage}
          data-tooltip-id="image"
          data-tooltip-content={profileImage}
        />
      ) : (
        <div className="Post__avatar-placeholder" />
      )}
      <a
        className="Post__author-name"
        href={`${WEB_APP}/profile/${profile ? profile.handle : atUri.hostname}`}
        data-tooltip-id="profile"
        data-tooltip-html={profileHtml}
      >
        {profile?.profile.displayName ?? profile?.handle ?? atUri.hostname}
      </a>{' '}
      {profile ? (
        <span className="Post__author-handle">@{profile.handle}</span>
      ) : null}
      <a
        className="Post__relative-date"
        href={`${WEB_APP}/profile/${atUri.hostname}/post/${atUri.rkey}`}
      >
        <time
          dateTime={date.toISOString()}
          title={date.toLocaleString()}
          aria-label={`${relativeDate} — click to open the post in the Bluesky web app`}
        >
          {relativeDate}
        </time>
      </a>
      <div className="Post__content">
        <RichText text={post.text} facets={post.facets} />
      </div>
      {post.embed ? (
        AppBskyEmbedImages.isMain(post.embed) ? (
          <PostImages
            service={service}
            did={atUri.hostname}
            images={post.embed.images}
          />
        ) : AppBskyEmbedRecordWithMedia.isMain(post.embed) ? (
          <>
            {AppBskyEmbedImages.isMain(post.embed.media) ? (
              <PostImages
                did={atUri.hostname}
                images={post.embed.media.images}
                service={service}
              />
            ) : null}
          </>
        ) : null
      ) : null}
      {post.embed ? (
        AppBskyEmbedExternal.isMain(post.embed) ? (
          <ExternalEmbed
            service={service}
            did={atUri.hostname}
            embed={post.embed.external}
          />
        ) : AppBskyEmbedRecordWithMedia.isMain(post.embed) ? (
          <>
            {AppBskyEmbedExternal.isMain(post.embed.media) ? (
              <ExternalEmbed
                service={service}
                did={atUri.hostname}
                embed={post.embed.media.external}
              />
            ) : null}
          </>
        ) : null
      ) : null}
      {embeddedPost ? (
        <Post
          service={service}
          className="Post__post-embed"
          uri={embeddedPost.uri}
          post={embeddedPost.record}
          isEmbedded
        />
      ) : null}
      {profileError ? (
        <FriendlyError
          className="Post__profile-error"
          heading="Error fetching author's profile"
          message={profileError}
        />
      ) : null}
      {embeddedPostError ? (
        <FriendlyError
          className="Post__post-embed-error"
          heading="Error fetching the quoted post"
          message={embeddedPostError}
        />
      ) : null}
      {isEmbedded && (
        <a
          className="Post__link"
          href={`${WEB_APP}/profile/${atUri.hostname}/post/${atUri.rkey}`}
        >
          Open post in the Bluesky web app
        </a>
      )}
    </article>
  )

  if (post.reply && parentPost) {
    return (
      <div className="PostThread">
        <Post
          service={service}
          uri={post.reply.parent.uri}
          post={{
            ...parentPost,
            reply: undefined,
          }}
        />
        {postNode}
      </div>
    )
  }

  if (post.reply && parentPostError) {
    return (
      <>
        <FriendlyError
          heading="Error fetching parent post"
          message={parentPostError}
        />
        {postNode}
      </>
    )
  }

  return postNode
}

export default Post
