import classNames from 'classnames'

function FriendlyError({
  className,
  heading,
  message,
}: {
  className?: string
  heading: string
  message: string
}) {
  return (
    <div className={classNames('bg-negative-25 dark:bg-negative-975 border border-negative-100 dark:border-negative-800 rounded-lg px-3 py-2', className)} role="alert">
      <div>
        <b className="text-negative-700 dark:text-negative-300">{heading}</b>
      </div>
      <span className="text-negative-600 dark:text-negative-400 text-sm">{message}</span>
    </div>
  )
}

export default FriendlyError
