'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CATEGORIES,
  DEFAULT_SUGGESTIONS,
  type CategoryId,
  type PinnedTask,
  type Task,
  type TrackerState,
  type ViewMode,
} from './types'
import { addDays, todayKey, weekDays } from './date-utils'
import { parseTaskInput, uid } from './parse'

const STORAGE_KEY = 'my-task-tracker:v1'

const emptyCategoryMap = () => ({ personal: [], work: [], family: [] })

function createInitialState(): TrackerState {
  return {
    tasksByDate: {},
    pinned: emptyCategoryMap(),
    pinnedCompletion: {},
    suggestions: {
      personal: [...DEFAULT_SUGGESTIONS.personal],
      work: [...DEFAULT_SUGGESTIONS.work],
      family: [...DEFAULT_SUGGESTIONS.family],
    },
    view: 'day',
    selectedDate: todayKey(),
    completedAlerts: [],
  }
}

function reviveState(raw: unknown): TrackerState {
  const base = createInitialState()
  if (!raw || typeof raw !== 'object') return base
  const r = raw as Partial<TrackerState>
  return {
    tasksByDate: r.tasksByDate ?? base.tasksByDate,
    pinned: { ...base.pinned, ...(r.pinned ?? {}) },
    pinnedCompletion: r.pinnedCompletion ?? base.pinnedCompletion,
    suggestions: { ...base.suggestions, ...(r.suggestions ?? {}) },
    view: r.view === 'week' || r.view === 'day' ? r.view : base.view,
    // Always start focused on today on reload but keep persisted if present
    selectedDate: r.selectedDate ?? base.selectedDate,
    completedAlerts: r.completedAlerts ?? base.completedAlerts,
  }
}

export interface DayTask extends Task {
  pinned: boolean
}

export interface ModalInfo {
  type: 'category' | 'all'
  category?: CategoryId
}

export function useTracker() {
  const [state, setState] = useState<TrackerState>(createInitialState)
  const [hydrated, setHydrated] = useState(false)
  const [modal, setModal] = useState<ModalInfo | null>(null)

  // Load from localStorage once on the client
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setState(reviveState(JSON.parse(stored)))
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true)
  }, [])

  // Persist
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore quota errors */
    }
  }, [state, hydrated])

  const update = useCallback((producer: (prev: TrackerState) => TrackerState) => {
    setState(producer)
  }, [])

  /* ------------------------------ getters ------------------------------ */

  const getUnpinned = useCallback(
    (category: CategoryId, dateKey: string): Task[] => {
      return state.tasksByDate[dateKey]?.[category] ?? []
    },
    [state.tasksByDate],
  )

  // Pinned tasks rendered for a specific day (completion is per-day)
  const getPinnedForDay = useCallback(
    (category: CategoryId, dateKey: string): DayTask[] => {
      const completion = state.pinnedCompletion[dateKey] ?? {}
      return state.pinned[category].map((p) => ({
        id: p.id,
        title: p.title,
        time: p.time,
        completed: !!completion[p.id],
        pinned: true,
      }))
    },
    [state.pinned, state.pinnedCompletion],
  )

  // All visible tasks for a day (pinned first, then unpinned)
  const getDayTasks = useCallback(
    (category: CategoryId, dateKey: string): DayTask[] => {
      const pinned = getPinnedForDay(category, dateKey)
      const unpinned = getUnpinned(category, dateKey).map((t) => ({ ...t, pinned: false }))
      return [...pinned, ...unpinned]
    },
    [getPinnedForDay, getUnpinned],
  )

  /* ------------------------------ mutations ------------------------------ */

  const learnSuggestion = (prev: TrackerState, category: CategoryId, title: string): string[] => {
    const list = prev.suggestions[category]
    const exists = list.some((s) => s.toLowerCase() === title.toLowerCase())
    if (exists || !title) return list
    return [...list, title]
  }

  const addTaskForDate = useCallback(
    (category: CategoryId, dateKey: string, raw: string) => {
      const { time, title } = parseTaskInput(raw)
      if (!title) return
      update((prev) => {
        const day = prev.tasksByDate[dateKey] ?? emptyCategoryMap()
        const newTask: Task = { id: uid(), title, time, completed: false }
        return {
          ...prev,
          tasksByDate: {
            ...prev.tasksByDate,
            [dateKey]: { ...day, [category]: [...day[category], newTask] },
          },
          suggestions: {
            ...prev.suggestions,
            [category]: learnSuggestion(prev, category, title),
          },
        }
      })
    },
    [update],
  )

  const toggleTask = useCallback(
    (category: CategoryId, dateKey: string, taskId: string, isPinned: boolean) => {
      update((prev) => {
        if (isPinned) {
          const dayCompletion = prev.pinnedCompletion[dateKey] ?? {}
          return {
            ...prev,
            pinnedCompletion: {
              ...prev.pinnedCompletion,
              [dateKey]: { ...dayCompletion, [taskId]: !dayCompletion[taskId] },
            },
          }
        }
        const day = prev.tasksByDate[dateKey] ?? emptyCategoryMap()
        return {
          ...prev,
          tasksByDate: {
            ...prev.tasksByDate,
            [dateKey]: {
              ...day,
              [category]: day[category].map((t) =>
                t.id === taskId ? { ...t, completed: !t.completed } : t,
              ),
            },
          },
        }
      })
    },
    [update],
  )

  const deleteTask = useCallback(
    (category: CategoryId, dateKey: string, taskId: string, isPinned: boolean) => {
      update((prev) => {
        if (isPinned) {
          return {
            ...prev,
            pinned: {
              ...prev.pinned,
              [category]: prev.pinned[category].filter((p) => p.id !== taskId),
            },
          }
        }
        const day = prev.tasksByDate[dateKey] ?? emptyCategoryMap()
        return {
          ...prev,
          tasksByDate: {
            ...prev.tasksByDate,
            [dateKey]: { ...day, [category]: day[category].filter((t) => t.id !== taskId) },
          },
        }
      })
    },
    [update],
  )

  const editTask = useCallback(
    (
      category: CategoryId,
      dateKey: string,
      taskId: string,
      isPinned: boolean,
      newTitle: string,
      newTime: string | null,
    ) => {
      if (!newTitle.trim()) return
      update((prev) => {
        if (isPinned) {
          return {
            ...prev,
            pinned: {
              ...prev.pinned,
              [category]: prev.pinned[category].map((p) =>
                p.id === taskId ? { ...p, title: newTitle, time: newTime } : p,
              ),
            },
            suggestions: {
              ...prev.suggestions,
              [category]: learnSuggestion(prev, category, newTitle),
            },
          }
        }
        const day = prev.tasksByDate[dateKey] ?? emptyCategoryMap()
        return {
          ...prev,
          tasksByDate: {
            ...prev.tasksByDate,
            [dateKey]: {
              ...day,
              [category]: day[category].map((t) =>
                t.id === taskId ? { ...t, title: newTitle, time: newTime } : t,
              ),
            },
          },
          suggestions: {
            ...prev.suggestions,
            [category]: learnSuggestion(prev, category, newTitle),
          },
        }
      })
    },
    [update],
  )

  // Pin an unpinned task (moves it into pinned list) or unpin a pinned task
  // (drops it back into the current day's unpinned list).
  const togglePin = useCallback(
    (category: CategoryId, dateKey: string, taskId: string, isPinned: boolean) => {
      update((prev) => {
        if (isPinned) {
          const p = prev.pinned[category].find((x) => x.id === taskId)
          if (!p) return prev
          const day = prev.tasksByDate[dateKey] ?? emptyCategoryMap()
          const restored: Task = { id: uid(), title: p.title, time: p.time, completed: false }
          return {
            ...prev,
            pinned: {
              ...prev.pinned,
              [category]: prev.pinned[category].filter((x) => x.id !== taskId),
            },
            tasksByDate: {
              ...prev.tasksByDate,
              [dateKey]: { ...day, [category]: [...day[category], restored] },
            },
          }
        }
        // pin: remove from unpinned, add to pinned
        const day = prev.tasksByDate[dateKey] ?? emptyCategoryMap()
        const t = day[category].find((x) => x.id === taskId)
        if (!t) return prev
        const newPinned: PinnedTask = { id: uid(), title: t.title, time: t.time }
        const dayCompletion = prev.pinnedCompletion[dateKey] ?? {}
        return {
          ...prev,
          pinned: { ...prev.pinned, [category]: [...prev.pinned[category], newPinned] },
          tasksByDate: {
            ...prev.tasksByDate,
            [dateKey]: { ...day, [category]: day[category].filter((x) => x.id !== taskId) },
          },
          // carry over current completion state for that day
          pinnedCompletion: {
            ...prev.pinnedCompletion,
            [dateKey]: { ...dayCompletion, [newPinned.id]: t.completed },
          },
        }
      })
    },
    [update],
  )

  // Reorder within a single category + group (pinned or unpinned) for a date
  const reorderTasks = useCallback(
    (
      category: CategoryId,
      group: 'pinned' | 'unpinned',
      dateKey: string,
      fromId: string,
      toId: string,
    ) => {
      if (fromId === toId) return
      update((prev) => {
        if (group === 'pinned') {
          const arr = [...prev.pinned[category]]
          const from = arr.findIndex((x) => x.id === fromId)
          const to = arr.findIndex((x) => x.id === toId)
          if (from === -1 || to === -1) return prev
          const [moved] = arr.splice(from, 1)
          arr.splice(to, 0, moved)
          return { ...prev, pinned: { ...prev.pinned, [category]: arr } }
        }
        const day = prev.tasksByDate[dateKey] ?? emptyCategoryMap()
        const arr = [...day[category]]
        const from = arr.findIndex((x) => x.id === fromId)
        const to = arr.findIndex((x) => x.id === toId)
        if (from === -1 || to === -1) return prev
        const [moved] = arr.splice(from, 1)
        arr.splice(to, 0, moved)
        return {
          ...prev,
          tasksByDate: { ...prev.tasksByDate, [dateKey]: { ...day, [category]: arr } },
        }
      })
    },
    [update],
  )

  const clearDay = useCallback(
    (dateKey: string) => {
      update((prev) => {
        const next = { ...prev.tasksByDate }
        delete next[dateKey]
        return {
          ...prev,
          tasksByDate: next,
          completedAlerts: prev.completedAlerts.filter((a) => !a.startsWith(`${dateKey}:`)),
        }
      })
    },
    [update],
  )

  /* ------------------------------ navigation ------------------------------ */

  const setView = useCallback((view: ViewMode) => update((p) => ({ ...p, view })), [update])
  const setSelectedDate = useCallback(
    (selectedDate: string) => update((p) => ({ ...p, selectedDate })),
    [update],
  )

  const goPrev = useCallback(() => {
    update((p) => {
      const step = p.view === 'day' ? addDays(p.selectedDate, -1) : addDays(p.selectedDate, -7)
      return { ...p, selectedDate: step }
    })
  }, [update])

  const goNext = useCallback(() => {
    update((p) => {
      const step = p.view === 'day' ? addDays(p.selectedDate, 1) : addDays(p.selectedDate, 7)
      return { ...p, selectedDate: step }
    })
  }, [update])

  const goToday = useCallback(() => update((p) => ({ ...p, selectedDate: todayKey() })), [update])

  /* ------------------------------ progress ------------------------------ */

  // Day view: count pinned + unpinned for the date.
  // Week view: count only unpinned tasks that have time across the period.
  const categoryProgress = useCallback(
    (category: CategoryId): { done: number; total: number } => {
      if (state.view === 'day') {
        const tasks = getDayTasks(category, state.selectedDate)
        return { done: tasks.filter((t) => t.completed).length, total: tasks.length }
      }
      const days = weekDays(state.selectedDate)
      let done = 0
      let total = 0
      for (const d of days) {
        const tasks = getUnpinned(category, d).filter((t) => t.time)
        total += tasks.length
        done += tasks.filter((t) => t.completed).length
      }
      return { done, total }
    },
    [state.view, state.selectedDate, getDayTasks, getUnpinned],
  )

  const overallProgress = useMemo(() => {
    let done = 0
    let total = 0
    for (const c of CATEGORIES) {
      const p = categoryProgress(c.id)
      done += p.done
      total += p.total
    }
    const percent = total === 0 ? 0 : Math.round((done / total) * 100)
    return { done, total, percent }
  }, [categoryProgress])

  /* ------------------------------ completion modals ------------------------------ */

  // Signature of completion state for the selected day (day view only)
  const completionSignature = useMemo(() => {
    if (state.view !== 'day') return ''
    return CATEGORIES.map((c) => {
      const tasks = getDayTasks(c.id, state.selectedDate)
      const complete = tasks.length > 0 && tasks.every((t) => t.completed)
      return `${c.id}:${tasks.length}:${complete ? 1 : 0}`
    }).join('|')
  }, [state.view, state.selectedDate, getDayTasks])

  const alertsRef = useRef(state.completedAlerts)
  alertsRef.current = state.completedAlerts

  useEffect(() => {
    if (state.view !== 'day' || !hydrated) return
    const dateKey = state.selectedDate
    const perCat = CATEGORIES.map((c) => ({
      id: c.id,
      tasks: getDayTasks(c.id, dateKey),
    }))
    const withTasks = perCat.filter((x) => x.tasks.length > 0)
    if (withTasks.length === 0) return
    const completeCats = withTasks.filter((x) => x.tasks.every((t) => t.completed))
    const everythingDone = completeCats.length === withTasks.length

    if (everythingDone) {
      const token = `${dateKey}:all`
      if (!alertsRef.current.includes(token)) {
        setModal({ type: 'all' })
        const newTokens = [token, ...withTasks.map((x) => `${dateKey}:${x.id}`)]
        update((p) => ({
          ...p,
          completedAlerts: Array.from(new Set([...p.completedAlerts, ...newTokens])),
        }))
      }
      return
    }

    // a single category completed while others remain
    for (const c of completeCats) {
      const token = `${dateKey}:${c.id}`
      if (!alertsRef.current.includes(token)) {
        setModal({ type: 'category', category: c.id })
        update((p) => ({
          ...p,
          completedAlerts: Array.from(new Set([...p.completedAlerts, token])),
        }))
        break
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completionSignature, hydrated])

  return {
    state,
    hydrated,
    modal,
    dismissModal: () => setModal(null),
    // getters
    getUnpinned,
    getDayTasks,
    categoryProgress,
    overallProgress,
    // mutations
    addTaskForDate,
    toggleTask,
    deleteTask,
    editTask,
    togglePin,
    reorderTasks,
    clearDay,
    // navigation
    setView,
    setSelectedDate,
    goPrev,
    goNext,
    goToday,
  }
}

export type TrackerApi = ReturnType<typeof useTracker>
