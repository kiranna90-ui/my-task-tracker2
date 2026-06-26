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

function categoryCounts(tracker: TrackerApi, dateKey: string) {
  return CATEGORIES.map((category) => ({
    category,
    count: tracker.getUnpinned(category.id, dateKey).filter((task) => task.time).length,
  })).filter((item) => item.count > 0)
}

function DayCell({
  dateKey,
  inMonth,
  tracker,
  focusedDate,
  onSelect,
}: {
  dateKey: string
  inMonth: boolean
  tracker: TrackerApi
  focusedDate: string | null
  onSelect: (key: string) => void
}) {
  const counts = categoryCounts(tracker, dateKey)
  const isToday = dateKey === todayKey()
  const isSelected = dateKey === focusedDate
  const dayNum = fromKey(dateKey).getDate()

  return (
    <button
      type="button"
      onClick={() => onSelect(dateKey)}
      className={cn(
        'flex min-h-[5.75rem] flex-col items-center gap-1 rounded-2xl px-1 py-2 transition active:scale-95',
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

      <span className="mt-1 flex min-h-[3.5rem] w-full flex-col items-center justify-start gap-0.5">
        {counts.map(({ category, count }) => (
          <span
            key={category.id}
            className={cn(
              'flex items-center justify-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold leading-none',
              isSelected ? 'bg-white/25 text-white' : 'bg-white/65 text-ink',
            )}
            aria-label={`${category.title}: ${count}`}
          >
            <span aria-hidden="true">{category.icon}</span>
            <span>{count}</span>
          </span>
        ))}
      </span>
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
