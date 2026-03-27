import {
  AppBskyFeedGenerator,
  AppBskyGraphList,
  AppBskyGraphStarterpack,
  AtUri,
} from '@atproto/api'
import { useMemo } from 'react'
import { getBlobURL } from '../utils/api'
import { WEB_APP } from '../utils/constants'
import { getRelativeDateString } from '../utils/datetime'

type FeedCardRecord =
  | AppBskyFeedGenerator.Record
  | AppBskyGraphList.Record
  | AppBskyGraphStarterpack.Record

function getRecordInfo(record: FeedCardRecord, did: string, rkey: string) {
  if (AppBskyFeedGenerator.isRecord(record)) {
    return {
      name: record.displayName,
      description: record.description,
      avatar: record.avatar,
      typeLabel: 'Feed',
      href: `${WEB_APP}/profile/${did}/feed/${rkey}`,
    }
  } else if (AppBskyGraphList.isRecord(record)) {
    return {
      name: record.name,
      description: record.description,
      avatar: record.avatar,
      typeLabel: 'List',
      href: `${WEB_APP}/profile/${did}/lists/${rkey}`,
    }
  } else {
    return {
      name: record.name,
      description: record.description,
      avatar: undefined,
      typeLabel: 'Starter Pack',
      href: `${WEB_APP}/starter-pack/${did}/${rkey}`,
    }
  }
}

function FeedCard({
  service,
  uri,
  record,
  verb,
  verbedAt,
}: {
  service: string
  uri: string
  record: FeedCardRecord
  verb?: string
  verbedAt?: string
}) {
  const atUri = useMemo(() => new AtUri(uri), [uri])

  const info = useMemo(
    () => getRecordInfo(record, atUri.hostname, atUri.rkey),
    [record, atUri.hostname, atUri.rkey],
  )

  const avatarURL = useMemo(() => {
    if (!info.avatar) return null
    return getBlobURL(service, atUri.hostname, info.avatar)
  }, [info.avatar, service, atUri.hostname])

  const [date, relativeDate] = useMemo(() => {
    if (verb && verbedAt) {
      const date = new Date(verbedAt)
      return [date, `${verb} ${getRelativeDateString(date)}`]
    }
    return [null, null]
  }, [verb, verbedAt])

  return (
    <article className="relative flex items-start gap-3 p-3 my-3 rounded-lg bg-contrast-50 dark:bg-contrast-950 min-w-0">
      {avatarURL ? (
        <img
          className="w-11 h-11 rounded-lg ring-1 ring-black/5 dark:ring-white/10 flex-shrink-0 object-cover"
          src={avatarURL}
          alt={info.name}
        />
      ) : (
        <div className="w-11 h-11 rounded-lg bg-contrast-100 dark:bg-contrast-800 flex-shrink-0 flex items-center justify-center text-contrast-400 dark:text-contrast-500 text-lg">
          {info.typeLabel === 'Feed' ? '📡' : info.typeLabel === 'List' ? '📋' : '🚀'}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <a
          className="font-bold text-contrast-1000 dark:text-contrast-0 no-underline hover:underline"
          href={info.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {info.name}
        </a>
        <span className="ml-2 text-xs text-contrast-500 dark:text-contrast-400 bg-contrast-100 dark:bg-contrast-800 px-1.5 py-0.5 rounded">
          {info.typeLabel}
        </span>
        {info.description ? (
          <div className="text-sm mt-0.5 text-contrast-700 dark:text-contrast-300 break-words">
            {info.description}
          </div>
        ) : null}
      </div>
      <div className="flex-shrink-0">
        {date && (
          <time
            className="text-sm text-contrast-600 dark:text-contrast-400 whitespace-nowrap cursor-default"
            dateTime={date.toISOString()}
            title={date.toLocaleString()}
          >
            {relativeDate}
          </time>
        )}
      </div>
    </article>
  )
}

export default FeedCard
