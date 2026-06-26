'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProgressBar } from './progress-bar'
import type { TrackerApi } from '@/lib/tracker/use-tracker'
import type { ViewMode } from '@/lib/tracker/types'
import { QUOTES } from '@/lib/tracker/types'
import {
  formatLongDate,
  formatWeekRange,
  fromKey,
  relativeDayLabel,
  dayOffsetFromToday,
  weekDays,
  todayKey,
} from '@/lib/tracker/date-utils'

const TABS: { id: ViewMode; label: string }[] = [
  { id: 'day', label: 'День' },
  { id: 'week', label: 'Неделя' },
]

export function HeaderCard({
  tracker,
  onSetView,
  onPrev,
  onNext,
  onToday,
}: {
  tracker: TrackerApi
  onSetView: (view: ViewMode) => void
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}) {
  const { state, overallProgress } = tracker
  const { selectedDate, view } = state

  // Stable quote per selected day
  const quote = QUOTES[fromKey(selectedDate).getDate() % QUOTES.length]

  const periodLabel = view === 'day' ? formatLongDate(selectedDate) : formatWeekRange(selectedDate)

  const weekOffset = Math.round(
    (fromKey(weekDays(selectedDate)[0]).getTime() - fromKey(weekDays(todayKey())[0]).getTime()) /
      (7 * 86400000),
  )
  const weekLabel = weekOffset < 0 ? 'Предыдущая' : weekOffset > 0 ? 'Следующая' : 'Текущая'
  const todayLabel = view === 'day' ? relativeDayLabel(selectedDate) : weekLabel
  const dayOffset = dayOffsetFromToday(selectedDate)
  const disablePrev = view === 'day' && dayOffset <= -1
  const disableNext = view === 'day' && dayOffset >= 1

  return (
    <section className="glass-card relative z-30 rounded-[2.25rem] px-6 pb-7 pt-12">
      <h1 className="flex items-center justify-center gap-3 text-center text-4xl font-black tracking-tight text-ink">
        <span>Мои задачи</span>
        <span className="inline-flex items-center leading-none" aria-hidden="true">💜</span>
      </h1>
      <p className="mt-1 text-center text-base font-bold text-muted-ink">{periodLabel}</p>
      <p className="mx-auto mt-2 max-w-[18rem] text-balance text-center text-sm font-bold text-purple">
        {quote}
      </p>

      {/* Overall progress */}
      <div className="glass-inner mt-6 rounded-3xl px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="text-base font-extrabold text-ink">Общий прогресс</span>
          <span className="text-base font-extrabold text-purple">{overallProgress.percent}%</span>
        </div>
        <ProgressBar percent={overallProgress.percent} className="mt-3" />
      </div>

      {/* Tabs */}
      <div className="mt-5 grid grid-cols-2 gap-1 rounded-3xl bg-white/55 p-1.5">
        {TABS.map((tab) => {
          const active = view === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSetView(tab.id)}
              className={
                'rounded-2xl py-3 text-sm font-extrabold transition-all ' +
                (active ? 'btn-gradient text-white shadow' : 'text-muted-ink hover:text-purple')
              }
              aria-pressed={active}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Period controls */}
      <div className="mt-4 flex items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={onPrev}
          disabled={disablePrev}
          aria-label={view === 'week' ? 'Предыдущая неделя' : 'Вчера'}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-purple shadow-sm transition hover:bg-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onToday}
          className="min-w-28 rounded-full bg-white/70 px-5 py-3 text-sm font-extrabold text-ink shadow-sm transition hover:bg-white active:scale-95"
        >
          {todayLabel}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={disableNext}
          aria-label={view === 'week' ? 'Следующая неделя' : 'Завтра'}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-purple shadow-sm transition hover:bg-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  )
}
