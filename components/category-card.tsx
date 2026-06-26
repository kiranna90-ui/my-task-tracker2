'use client'

import { useRef, useState } from 'react'
import { ArrowLeft, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProgressBar } from './progress-bar'
import { TaskList } from './task-list'
import type { Category } from '@/lib/tracker/types'
import type { TrackerApi } from '@/lib/tracker/use-tracker'
import { formatDayLabel, weekDays } from '@/lib/tracker/date-utils'

export function CategoryCard({
  category,
  tracker,
  focusedDate,
  onClearFocus,
}: {
  category: Category
  tracker: TrackerApi
  focusedDate: string | null
  onClearFocus: () => void
}) {
  const { state } = tracker
  const view = state.view
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const progress = tracker.categoryProgress(category.id)
  const percent = progress.total === 0 ? 0 : Math.round((progress.done / progress.total) * 100)

  // Which day does the input add to?
  const inputDate =
    view === 'day' ? state.selectedDate : focusedDate /* week focused day */

  const showInput = view === 'day' || focusedDate !== null

  const submit = (raw: string) => {
    if (!inputDate || !raw.trim()) return
    tracker.addTaskForDate(category.id, inputDate, raw)
    setValue('')
    inputRef.current?.focus()
  }

  return (
    <section
      className={cn(
        'glass-card rounded-[2rem] p-5 transition-[z-index]',
        'relative z-10',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-white/70 text-3xl shadow-sm">
          <span aria-hidden="true">{category.icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-extrabold text-ink">{category.title}</h2>
          <p className="text-xs font-bold text-muted-ink">
            {progress.done}/{progress.total} выполнено
          </p>
        </div>
        <span className="text-sm font-extrabold text-purple">{percent}%</span>
      </div>
      <ProgressBar percent={percent} className="mt-3" height="h-2" />

      {/* Input */}
      {showInput && (
        <div className="relative mt-4">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit(value)
              }}
              placeholder="Время и задача, например: 09.30 прогулка"
              className="min-w-0 flex-1 rounded-2xl border border-white/70 bg-white/75 px-4 py-2.5 text-sm font-semibold text-ink outline-none placeholder:text-muted-ink/70 focus:border-purple/50"
            />
            <button
              type="button"
              onClick={() => submit(value)}
              aria-label="Добавить задачу"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl btn-gradient text-white transition active:scale-95"
            >
              <Plus className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

      {/* Tasks */}
      <div className="mt-4">
        {view === 'day' ? (
          <DayTasks category={category} tracker={tracker} />
        ) : (
          <PeriodTasks
            category={category}
            tracker={tracker}
            focusedDate={focusedDate}
            onClearFocus={onClearFocus}
          />
        )}
      </div>
    </section>
  )
}

function DayTasks({ category, tracker }: { category: Category; tracker: TrackerApi }) {
  const dateKey = tracker.state.selectedDate
  const all = tracker.getDayTasks(category.id, dateKey)
  const pinned = all.filter((t) => t.pinned)
  const unpinned = all.filter((t) => !t.pinned)

  if (all.length === 0) {
    return <p className="py-2 text-center text-sm font-semibold text-muted-ink">Пока нет задач ✨</p>
  }

  return (
    <div className="flex flex-col gap-2">
      <TaskList tasks={pinned} category={category.id} dateKey={dateKey} group="pinned" tracker={tracker} />
      <TaskList tasks={unpinned} category={category.id} dateKey={dateKey} group="unpinned" tracker={tracker} />
    </div>
  )
}

function PeriodTasks({
  category,
  tracker,
  focusedDate,
  onClearFocus,
}: {
  category: Category
  tracker: TrackerApi
  focusedDate: string | null
  onClearFocus: () => void
}) {
  const { state } = tracker
  const days = weekDays(state.selectedDate)

  // Focused single day (even if empty) so the user can add tasks for it
  if (focusedDate) {
    const tasks = tracker.getUnpinned(category.id, focusedDate).filter((t) => t.time).map((t) => ({ ...t, pinned: false }))
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onClearFocus}
          className="flex items-center gap-1 self-start rounded-full bg-white/60 px-3 py-1 text-xs font-bold text-purple transition hover:bg-white"
        >
          <ArrowLeft className="h-3 w-3" />
          Все дни недели
        </button>
        <p className="text-xs font-extrabold text-muted-ink">{formatDayLabel(focusedDate)}</p>
        {tasks.length === 0 ? (
          <p className="py-2 text-center text-sm font-semibold text-muted-ink">
            На этот день пока нет дел — добавь первое ✨
          </p>
        ) : (
          <TaskList
            tasks={tasks}
            category={category.id}
            dateKey={focusedDate}
            group="unpinned"
            tracker={tracker}
          />
        )}
      </div>
    )
  }

  // Grouped: only days that have unpinned tasks with time
  const daysWithTasks = days.filter((d) => tracker.getUnpinned(category.id, d).some((t) => t.time))

  if (daysWithTasks.length === 0) {
    return (
      <p className="rounded-2xl bg-white/55 px-4 py-3 text-center text-sm font-semibold text-muted-ink">
        На этой неделе пока нет задач с указанным временем ✨
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {daysWithTasks.map((d) => {
        const tasks = tracker.getUnpinned(category.id, d).filter((t) => t.time).map((t) => ({ ...t, pinned: false }))
        return (
          <div key={d} className="flex flex-col gap-2">
            <p className="text-xs font-extrabold text-muted-ink">{formatDayLabel(d)}</p>
            <TaskList tasks={tasks} category={category.id} dateKey={d} group="unpinned" tracker={tracker} />
          </div>
        )
      })}
    </div>
  )
}
