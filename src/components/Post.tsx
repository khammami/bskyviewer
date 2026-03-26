import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedPost,
  AtUri,
} from '@atproto/api'
import classNames from 'classnames'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { renderToString } from 'react-dom/server'
import { Filter } from '../App'
import { Profile, fetchPost, fetchProfile, getBlobURL } from '../utils/api'
import { WEB_APP } from '../utils/constants'
import { getRelativeDateString } from '../utils/datetime'
import FriendlyError from './FriendlyError'
import RichText from './RichText'
import Spinner from './Spinner'
import User from './User'

const ReplyContext = createContext<[boolean, (value: boolean) => void]>([true, () => { }]);

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
    <a href={embed.uri} target="_blank" className="col-span-full mt-2 block rounded-lg border border-contrast-100 dark:border-contrast-800 overflow-hidden no-underline hover:bg-contrast-25 dark:hover:bg-contrast-950 transition-colors">
      {embed.thumb ? (
        <img
          className="w-full h-40 object-cover"
          src={getBlobURL(service, did, embed.thumb)}
          alt={embed.title}
        />
      ) : null}
      <div className="p-3">
        <span className="font-bold text-contrast-1000 dark:text-contrast-0 text-sm">{embed.title}</span>
        <br />
        <span className="text-contrast-400 dark:text-contrast-600 text-sm">
          {embed.description}
        </span>
      </div>
    </a>
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
        className="col-span-full mt-2 w-full max-h-[60vh] rounded-lg object-cover ring-1 ring-black/5 dark:ring-white/10"
        src={url}
        alt={images[0].alt}
        data-tooltip-id="image"
        data-tooltip-content={url}
      />
    )
  }

  return (
    <div className="col-span-full mt-2 grid grid-cols-2 gap-1 h-[60vh] min-h-[400px] overflow-hidden rounded-lg">
      {images.map((image, idx) => {
        const url = getBlobURL(service, did, image.image)
        return (
          <img
            key={idx}
            src={url}
            alt={image.alt}
            className="w-full h-full object-cover ring-1 ring-black/5 dark:ring-white/10"
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
  depth = 0,
}: {
  service: string
  className?: string
  uri: string
  post: AppBskyFeedPost.Record
  verb?: string
  verbedAt?: string
  isEmbedded?: boolean
  depth?: number
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
  const [hideReplies, setHideReplies] = useContext(ReplyContext);
  const [filter, setFilter] = useContext(Filter);

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

  useEffect(() => {
    if (post.reply && parentPost && !filter.contains(post.reply.parent.uri)) {
      setFilter(filter.add(post.reply.parent.uri))
    }
  }, [post.reply, parentPost, filter, setFilter])

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

  const postNode =
    hideReplies && depth > 1 && parentPost ? null : (
      <article
        className={classNames(
          'relative py-3',
          isEmbedded
            ? 'grid grid-cols-[auto_minmax(0,max-content)_1fr_auto] px-3 border border-contrast-100 dark:border-contrast-800 rounded-lg mt-2 text-sm'
            : 'grid grid-cols-[auto_minmax(0,max-content)_1fr_auto]',
          className,
        )}
      >
        {profileImage ? (
          <img
            className={classNames(
              'row-span-1 rounded-full ring-2 ring-contrast-0 dark:ring-contrast-975 object-cover',
              isEmbedded ? 'w-6 h-6 mr-2' : 'w-11 h-11 mr-3',
            )}
            style={{ gridRow: isEmbedded ? undefined : '1 / -1' }}
            src={profileImage}
            data-tooltip-id="image"
            data-tooltip-content={profileImage}
          />
        ) : (
          <div
            className={classNames(
              'rounded-full bg-contrast-100 dark:bg-contrast-800',
              isEmbedded ? 'w-6 h-6 mr-2' : 'w-11 h-11 mr-3',
            )}
            style={{ gridRow: isEmbedded ? undefined : '1 / -1' }}
          />
        )}
        <a
          className="self-center mr-1 font-bold text-contrast-1000 dark:text-contrast-0 no-underline hover:underline truncate"
          href={`${WEB_APP}/profile/${profile ? profile.handle : atUri.hostname}`}
          data-tooltip-id="profile"
          data-tooltip-html={profileHtml}
        >
          {profile?.profile.displayName ?? profile?.handle ?? atUri.hostname}
        </a>{' '}
        {profile ? (
          <span className="self-center text-sm text-contrast-400 dark:text-contrast-600 truncate">@{profile.handle}</span>
        ) : null}
        <a
          className="self-center text-sm text-contrast-400 dark:text-contrast-600 no-underline hover:underline whitespace-nowrap text-right"
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
        <div className={isEmbedded ? 'col-span-full' : 'col-[2/-1]'}>
          <div className="mt-1">
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
              uri={embeddedPost.uri}
              post={embeddedPost.record}
              isEmbedded
            />
          ) : null}
          {profileError ? (
            <FriendlyError
              className="mt-2"
              heading="Error fetching author's profile"
              message={profileError}
            />
          ) : null}
          {embeddedPostError ? (
            <FriendlyError
              className="mt-2"
              heading="Error fetching the quoted post"
              message={embeddedPostError}
            />
          ) : null}
        </div>
        {isEmbedded && (
          <a
            className="absolute inset-0 text-[0px]"
            href={`${WEB_APP}/profile/${atUri.hostname}/post/${atUri.rkey}`}
          >
            Open post in the Bluesky web app
          </a>
        )}
      </article>
    )

  if (parentPostError) {
    return (
      <>
        <FriendlyError
          heading="Error fetching parent post"
          message={parentPostError}
        />
        {postNode}
      </>
    )
  } else if (post.reply && !isEmbedded) {
    const thread = (
      <>
        {parentPost ? (
          <Post
            service={service}
            uri={post.reply.parent.uri}
            post={parentPost}
            depth={depth + 1}
          />
        ) : (
          <Spinner />
        )}
        {postNode}
      </>
    )
    return depth === 0 ? (
      <div className="[&>article:not(:last-child)]:relative [&>article:not(:last-child)]:before:absolute [&>article:not(:last-child)]:before:top-4 [&>article:not(:last-child)]:before:left-[21px] [&>article:not(:last-child)]:before:w-0.5 [&>article:not(:last-child)]:before:h-full [&>article:not(:last-child)]:before:bg-contrast-200 [&>article:not(:last-child)]:before:dark:bg-contrast-800 [&>article:not(:last-child)]:before:z-[1]">
        {thread}
      </div>
    ) : thread
  } else if (depth > 2) {
    return (
      <>
        {postNode}
        {hideReplies && (
          <div className="relative italic text-contrast-400 dark:text-contrast-600 before:absolute before:left-[21px] before:w-0.5 before:h-[200%] before:z-[2] before:bg-[repeating-linear-gradient(0deg,white_0_2px,#C0CAD8_2px_4px)] dark:before:bg-[repeating-linear-gradient(0deg,black_0_2px,#313F54_2px_4px)]">
            <span className="pl-14 cursor-pointer hover:underline" onClick={() => setHideReplies(false)}>
              {depth - 2} {depth > 3 ? 'replies' : 'reply'} hidden
            </span>
          </div>
        )}
      </>
    )
  } else {
    return postNode
  }
}

function WithContext(props: Parameters<typeof Post>[0]) {
  const replyState = useState(true);
  return <ReplyContext value={replyState}>
    <Post {...props} />
  </ReplyContext>
}

export default WithContext
