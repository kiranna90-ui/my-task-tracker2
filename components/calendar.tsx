'use client'

import { cn } from '@/lib/utils'
import { CATEGORIES } from '@/lib/tracker/types'
import type { TrackerApi } from '@/lib/tracker/use-tracker'
import {
  formatWeekRange,
  fromKey,
  todayKey,
  weekDays,
  WEEKDAYS_SHORT,
} from '@/lib/tracker/date-utils'

function dayStats(tracker: TrackerApi, dateKey: string) {
  let done = 0
  let total = 0
  for (const c of CATEGORIES) {
    const tasks = tracker.getUnpinned(c.id, dateKey).filter((t) => t.time)
    total += tasks.length
    done += tasks.filter((t) => t.completed).length
  }
  return { done, total }
}

function DayCell({
  dateKey,
  inMonth,
  tracker,
  focusedDate,
  onSelect,
  compact,
}: {
  dateKey: string
  inMonth: boolean
  tracker: TrackerApi
  focusedDate: string | null
  onSelect: (key: string) => void
  compact?: boolean
}) {
  const { done, total } = dayStats(tracker, dateKey)
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  const isToday = dateKey === todayKey()
  const isSelected = dateKey === focusedDate
  const dayNum = fromKey(dateKey).getDate()

  return (
    <button
      type="button"
      onClick={() => onSelect(dateKey)}
      className={cn(
        'flex flex-col items-center gap-1 rounded-2xl px-1 py-2 transition active:scale-95',
        isSelected ? 'btn-gradient text-white shadow' : 'bg-white/55 hover:bg-white/80',
        !inMonth && 'opacity-35',
      )}
    >
      <span className="relative text-sm font-extrabold leading-none">
        <span className={cn(isSelected ? 'text-white' : 'text-ink')}>{dayNum}</span>
        {isToday && !isSelected && (
          <span className="absolute -inset-1 rounded-full ring-2 ring-purple/60" aria-hidden="true" />
        )}
      </span>

      {total > 0 ? (
        <>
          <span
            className={cn(
              'text-[10px] font-bold leading-none',
              isSelected ? 'text-white/90' : 'text-muted-ink',
            )}
          >
            {done}/{total}
          </span>
          <span
            className={cn(
              'h-1 w-full overflow-hidden rounded-full',
              isSelected ? 'bg-white/40' : 'bg-lavender/50',
            )}
          >
            <span
              className={cn('block h-full rounded-full', isSelected ? 'bg-white' : 'btn-gradient')}
              style={{ width: `${percent}%` }}
            />
          </span>
        </>
      ) : (
        <span className={cn('text-[10px] leading-none', compact ? 'h-1' : 'h-3.5')} aria-hidden="true" />
      )}

      {/* indicator dot for days with unpinned tasks */}
      {total > 0 && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full', isSelected ? 'bg-white' : 'bg-pink')}
          aria-hidden="true"
        />
      )}
    </button>
  )
}

export function WeekCalendar({
  tracker,
  focusedDate,
  onSelect,
}: {
  tracker: TrackerApi
  focusedDate: string | null
  onSelect: (key: string) => void
}) {
  const days = weekDays(tracker.state.selectedDate)
  return (
    <section className="glass-card rounded-[2rem] p-4">
      <p className="mb-3 text-center text-sm font-extrabold text-ink">
        {formatWeekRange(tracker.state.selectedDate)}
      </p>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS_SHORT.map((w) => (
          <span key={w} className="text-center text-[11px] font-bold text-muted-ink">
            {w}
          </span>
        ))}
        {days.map((d) => (
          <DayCell
            key={d}
            dateKey={d}
            inMonth
            tracker={tracker}
            focusedDate={focusedDate}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  )
}
