import classNames from 'classnames'

function Spinner({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  return (
    <span
      className={classNames(
        'inline-block rounded-full border-contrast-200 dark:border-contrast-800 border-t-primary-500 animate-spin',
        size === 'lg' ? 'w-10 h-10 border-[5px]' : 'w-5 h-5 border-[3px]',
      )}
      role="status"
      aria-label="Loading"
    />
  )
}

export default Spinner
