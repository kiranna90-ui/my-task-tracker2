import { cn } from '@/lib/utils'

export function ProgressBar({
  percent,
  className,
  height = 'h-2.5',
}: {
  percent: number
  className?: string
  height?: string
}) {
  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-lavender/40', height, className)}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full btn-gradient transition-all duration-500 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  )
}
