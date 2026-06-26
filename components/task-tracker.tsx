'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Hero } from './hero'
import { HeaderCard } from './header-card'
import { CategoryCard } from './category-card'
import { WeekCalendar } from './calendar'
import { CompletionModal } from './completion-modal'
import { useTracker } from '@/lib/tracker/use-tracker'
import { CATEGORIES, type ViewMode } from '@/lib/tracker/types'

export function TaskTracker() {
  const tracker = useTracker()
  const [focusedDate, setFocusedDate] = useState<string | null>(null)
  const { state, hydrated, loading, syncError, modal, dismissModal } = tracker

  const handleSetView = (view: ViewMode) => {
    tracker.setView(view)
    setFocusedDate(null)
  }
  const handlePrev = () => {
    tracker.goPrev()
    setFocusedDate(null)
  }
  const handleNext = () => {
    tracker.goNext()
    setFocusedDate(null)
  }
  const handleToday = () => {
    tracker.goToday()
    setFocusedDate(null)
  }
  const handleSelectDay = (key: string) => {
    tracker.setSelectedDate(key)
    setFocusedDate(key)
  }

  return (
    <div className="app-bg min-h-dvh w-full">
      <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col gap-2 px-4 pb-16">
        <Hero />

        <HeaderCard
          tracker={tracker}
          onSetView={handleSetView}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
        />

        {loading && (
          <div className="rounded-[2rem] bg-white/60 px-5 py-4 text-center text-sm font-extrabold text-muted-ink shadow-sm">
            Загружаю задачи ✨
          </div>
        )}

        {syncError && (
          <div className="rounded-[2rem] bg-white/70 px-5 py-4 text-center text-sm font-extrabold text-pink shadow-sm">
            {syncError}
          </div>
        )}

        {/* Avoid hydration mismatch: only render date-dependent content client-side */}
        {hydrated && !loading && (
          <>
            {state.view === 'week' && (
              <WeekCalendar tracker={tracker} focusedDate={focusedDate} onSelect={handleSelectDay} />
            )}
            {CATEGORIES.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                tracker={tracker}
                focusedDate={focusedDate}
                onClearFocus={() => setFocusedDate(null)}
              />
            ))}

            {state.view === 'day' && (
              <button
                type="button"
                onClick={() => tracker.clearDay(state.selectedDate)}
                className="relative z-0 mt-1 flex items-center justify-center gap-2 self-center rounded-full bg-white/65 px-6 py-3 text-sm font-extrabold text-pink shadow-sm transition hover:bg-white active:scale-95"
              >
                <Trash2 className="h-4 w-4" />
                Очистить день
              </button>
            )}
          </>
        )}
      </main>

      {modal && <CompletionModal modal={modal} onClose={dismissModal} />}
    </div>
  )
}
