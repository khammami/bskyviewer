import { AtUri } from '@atproto/api'
import { useMemo } from 'react'
import { Profile, getBlobURL } from '../utils/api'
import { WEB_APP } from '../utils/constants'
import { getRelativeDateString } from '../utils/datetime'

function User({
  service,
  profile: { uri, handle, profile },
  verb,
  verbedAt,
}: {
  service: string
  profile: Profile
  verb?: string
  verbedAt?: string
}) {
  const atUri = useMemo(() => new AtUri(uri), [uri])

  const profileImage = useMemo(() => {
    if (!profile.avatar) {
      return null
    }

    return getBlobURL(service, atUri.hostname, profile.avatar)
  }, [atUri.hostname, profile, service])

  const bannerImage = useMemo(() => {
    if (!profile.banner) {
      return null
    }

    return getBlobURL(service, atUri.hostname, profile.banner)
  }, [atUri.hostname, profile, service])

  const [date, relativeDate] = useMemo(() => {
    if (verb && verbedAt) {
      const date = new Date(verbedAt)
      return [date, `${verb} ${getRelativeDateString(date)}`]
    }
    return [null, null]
  }, [verb, verbedAt])

  return (
    <article
      className="relative flex items-start gap-3 p-3 my-3 rounded-lg bg-contrast-50 dark:bg-contrast-950 bg-cover bg-center min-w-0"
      style={
        bannerImage ? { backgroundImage: `url(${bannerImage})` } : undefined
      }
      data-tooltip-id={bannerImage ? 'image' : undefined}
      data-tooltip-content={bannerImage}
    >
      {profileImage ? (
        <img
          className="w-11 h-11 rounded-full ring-2 ring-contrast-0 dark:ring-contrast-975 ring-1 ring-black/5 dark:ring-white/10 flex-shrink-0 object-cover"
          src={profileImage}
          data-tooltip-id="image"
          data-tooltip-content={profileImage}
        />
      ) : (
        <div className="w-11 h-11 rounded-full bg-contrast-100 dark:bg-contrast-800 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <a
          className="font-bold text-contrast-1000 dark:text-contrast-0 no-underline hover:underline px-0.5 rounded bg-white/75 dark:bg-black/75 backdrop-blur-sm"
          href={`${WEB_APP}/profile/${handle ?? atUri.hostname}`}
        >
          {profile.displayName ?? handle ?? atUri.hostname}
        </a>
        <br />
        {handle ? (
          <span className="text-sm text-contrast-600 dark:text-contrast-400 px-0.5 rounded bg-white/75 dark:bg-black/60 backdrop-blur-sm">
            @{handle}
          </span>
        ) : null}
        <br />
        {profile.description ? (
          <div className="text-sm mt-0.5 px-0.5 rounded bg-white/75 dark:bg-black/75 backdrop-blur-sm break-words">
            {profile.description}
          </div>
        ) : null}
      </div>
      <div className="flex-shrink-0">
        {date && (
          <time
            className="text-sm text-contrast-600 dark:text-contrast-400 whitespace-nowrap px-0.5 rounded bg-white/75 dark:bg-black/60 backdrop-blur-sm cursor-default"
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

export default User
