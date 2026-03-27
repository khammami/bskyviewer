import classNames from 'classnames'
import { Set } from 'immutable'
import { Context, FormEvent, createContext, useEffect, useMemo, useReducer, useState } from 'react'
import { Tooltip } from 'react-tooltip'
import FriendlyError from './components/FriendlyError'
import { Record } from './components/Record'
import Spinner from './components/Spinner'
import ThemeToggle from './components/ThemeToggle'
import User from './components/User'
import { Profile, fetchPosts, fetchProfile } from './utils/api'
import { DEFAULT_SERVICE, WEB_APP } from './utils/constants'
import { applyTheme, initThemeListener } from './utils/theme'

type Posts = Awaited<ReturnType<typeof fetchPosts>>['records']

const collections = {
  posts: 'app.bsky.feed.post',
  shares: 'app.bsky.feed.repost',
  likes: 'app.bsky.feed.like',
  follows: 'app.bsky.graph.follow',
  blocks: 'app.bsky.graph.block',
  'starter packs': 'app.bsky.graph.starterpack',
}

const cleanHandle = (handle: string, service: string) => {
  if (!handle.includes('.') && !handle.includes(':')) {
    handle = handle + '.' + new URL(service).host
  }
  return handle.toLowerCase().trim().replace(/^@/, '')
}

// eslint-disable-next-line react-refresh/only-export-components
export const Filter: Context<[Set<string>, (value: Set<string>) => void]> = createContext([Set(), (_) => { }])

function App() {
  const [isLoading, setIsLoading] = useState(false)
  const [profileHandle, setProfileHandle] = useState('')
  const [profile, setProfile] = useState<Profile>()
  const [service, setService] = useState(DEFAULT_SERVICE)
  const filterState = useState(Set<string>())
  const [, setFilter] = filterState
  const [collection, setCollection] = useState({
    name: 'posts',
    id: 'app.bsky.feed.post',
  })
  const [error, setError] = useState<string>()
  const [cursor, setCursor] = useState<string>()
  const [records, addEntries] = useReducer(
    (state: Posts, { cursor, records }: { cursor?: string; records: Posts }) =>
      cursor ? [...state, ...records] : records,
    [],
  )
  const [count, increment] = useReducer((state) => state + 1, 0)

  const load = useMemo(
    () => (abort: AbortController, cursor?: string) => {
      if (!profileHandle) {
        return
      }

      setError(undefined)
      if (!cursor) {
        setIsLoading(true)
        setFilter(Set())
      }

      return fetchPosts({
        service,
        handle: cleanHandle(profileHandle, service),
        collection: collection.id,
        cursor,
      })
        .then(({ records, cursor: newCursor }) => {
          if (!abort.signal.aborted) {
            addEntries({ cursor, records })
            setCursor(newCursor)
            setIsLoading(false)
          }
        })
        .catch((error) => {
          if (!abort.signal.aborted) {
            addEntries({ records: [] })
            setCursor(undefined)
            setError(error.message)
            setIsLoading(false)
          }
        })
    },
    [collection.id, profileHandle, service, setFilter],
  )

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const url = new URL(service)
      if (url.protocol !== 'https:') {
        setError('Service URL must use HTTPS')
        return
      }
    } catch {
      setError('Invalid service URL')
      return
    }
    increment()
  }

  useEffect(() => {
    applyTheme()
    return initThemeListener()
  }, [])

  useEffect(() => {
    if (!count) {
      return
    }

    const abort = new AbortController()

    load(abort)

    return () => abort.abort()
  }, [load, count])

  useEffect(() => {
    if (!count || !profileHandle) {
      return
    }

    return fetchProfile(
      service,
      cleanHandle(profileHandle, service),
      setProfile,
      setError,
    )
  }, [count, profileHandle, service])

  useEffect(() => {
    if (!cursor) {
      return
    }
    const abort = new AbortController()

    let fetchingMore = false

    function onScroll() {
      if (!fetchingMore && document.body.scrollHeight - window.scrollY < 2000) {
        fetchingMore = true
        load(abort, cursor)
        // The cursor will change and the effect will run again
      }
    }

    onScroll()

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      abort.abort()
      window.removeEventListener('scroll', onScroll)
    }
  }, [cursor, load])

  return (
    <Filter value={filterState}>
      <div className="max-w-content mx-auto px-4 py-6 min-h-screen">
        <header className="mb-8 flex items-start justify-between gap-4">
          <p className="text-sm text-contrast-400 dark:text-contrast-600">
            <a href="https://github.com/bskyviewer/bskyviewer.github.io" className="hover:underline text-primary-500 dark:text-primary-400">
              source code
            </a>
            {' • '}
            based on{' '}
            <a href="https://handlerug.github.io/bluesky-liked-posts/" className="hover:underline text-primary-500 dark:text-primary-400">
              bluesky-liked-posts
            </a>{' '}
            by{' '}
            <a href={`${WEB_APP}/profile/did:plc:uowmeg4dqtanpmjuknadqjqc`} className="hover:underline text-primary-500 dark:text-primary-400">
              @handlerug.bsky.social
            </a>
          </p>
          <ThemeToggle />
        </header>

        <main>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="profile-handle" className="block text-sm text-contrast-400 dark:text-contrast-600 mb-1.5">
                username
              </label>
              <input
                id="profile-handle"
                type="text"
                name="handle"
                placeholder="jesopo.bsky.social"
                value={profileHandle}
                onChange={(ev) => setProfileHandle(ev.target.value)}
                className="w-full rounded-lg border-0 bg-contrast-0 dark:bg-contrast-975 shadow-sm ring-1 ring-contrast-200 dark:ring-contrast-800 px-3.5 py-3 text-inherit font-inherit placeholder:text-contrast-400 dark:placeholder:text-contrast-500 transition-shadow focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <details className="group">
              <summary className="text-sm text-contrast-400 dark:text-contrast-600 cursor-pointer hover:text-contrast-700 dark:hover:text-contrast-300 transition-colors select-none">
                Advanced settings
              </summary>
              <div className="mt-3">
                <label htmlFor="service-url" className="block text-sm text-contrast-400 dark:text-contrast-600 mb-1.5">
                  ATProto service URL
                </label>
                <input
                  id="service-url"
                  type="text"
                  name="service"
                  placeholder={DEFAULT_SERVICE}
                  value={service}
                  onChange={(ev) => setService(ev.target.value)}
                  className="w-full rounded-lg border-0 bg-contrast-0 dark:bg-contrast-975 shadow-sm ring-1 ring-contrast-200 dark:ring-contrast-800 px-3.5 py-3 text-inherit font-inherit placeholder:text-contrast-400 dark:placeholder:text-contrast-500 transition-shadow focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </details>

            {profile && (
              <User service={service} profile={profile} />
            )}

            <div className="flex gap-1.5">
              {Object.entries(collections).map(([name, id]) => (
                <button
                  key={id}
                  type="submit"
                  onClick={() => setCollection({ name, id })}
                  className={classNames(
                    'relative flex-1 rounded-lg font-bold py-3 px-3 text-white cursor-pointer overflow-hidden transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black',
                    name === collection.name
                      ? 'bg-[#054CFF] hover:bg-[#1085FE] shadow-md'
                      : 'bg-contrast-800 dark:bg-contrast-800 hover:bg-contrast-700 dark:hover:bg-contrast-700 shadow-sm',
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
          </form>

          <div
            className={classNames(
              'relative overflow-hidden transition-all duration-200 ease-out',
              isLoading ? 'h-24 opacity-100 mt-4' : 'h-0 opacity-0 pointer-events-none',
            )}
            aria-hidden={!isLoading}
          >
            <div className="absolute inset-x-0 bottom-0 h-20 flex items-center justify-center gap-4 bg-contrast-0 dark:bg-contrast-975 rounded-xl ring-1 ring-contrast-100 dark:ring-contrast-900 shadow-sm text-center">
              <Spinner size="lg" />
              <span className="text-contrast-600 dark:text-contrast-300">Loading your {collection.name}…</span>
            </div>
          </div>

          {error ? (
            <FriendlyError
              className="mt-4"
              heading={`Error fetching ${collection.name}`}
              message={error}
            />
          ) : records.length > 0 ? (
            <div
              className={classNames(
                'mt-4 bg-contrast-0 dark:bg-contrast-975 rounded-xl ring-1 ring-contrast-100 dark:ring-contrast-900 shadow-xl px-4 py-2 transition-opacity duration-200',
                isLoading && 'opacity-50',
              )}
            >
              {records.map((record) => (
                <Record key={record.uri} record={record} service={service} />
              ))}
              {cursor ? (
                <div
                  className="text-center py-4"
                  aria-label="Loading more posts"
                >
                  <Spinner />
                </div>
              ) : null}
            </div>
          ) : null}
        </main>
        <Tooltip
          id="image"
          opacity={1}
          style={{ zIndex: 100 }}
          render={({ content }) => (
            content ? <img className="max-w-xs max-h-48 rounded" src={content} /> : null
          )}
        />
        <Tooltip id="profile" opacity={1} style={{ zIndex: 100 }} />
      </div>
    </Filter>
  )
}

export default App
