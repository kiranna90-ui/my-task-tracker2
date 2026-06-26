'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase-client'
import {
  CATEGORIES,
  DEFAULT_SUGGESTIONS,
  type CategoryId,
  type PinnedTask,
  type Task,
  type TrackerState,
  type ViewMode,
} from './types'
import { addDays, dayOffsetFromToday, todayKey, weekDays } from './date-utils'
import { parseTaskInput, uid } from './parse'

const STORAGE_KEY = 'my-task-tracker:v1'

type DbTask = {
  id: string
  title: string
  task_date: string
  task_time: string | null
  category: CategoryId
  completed: boolean | null
  sort_order: number | null
}

type DbPinnedTask = {
  id: string
  title: string
  task_time: string | null
  category: CategoryId
  sort_order: number | null
}

type DbPinnedCompletion = {
  task_date: string
  pinned_task_id: string
  completed: boolean | null
}

const emptyCategoryMap = () => ({ personal: [], work: [], family: [] } as Record<CategoryId, Task[]>)
const emptyPinnedMap = () => ({ personal: [], work: [], family: [] } as Record<CategoryId, PinnedTask[]>)

function createInitialState(): TrackerState {
  return {
    tasksByDate: {},
    pinned: emptyPinnedMap(),
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
    selectedDate: r.selectedDate ?? base.selectedDate,
    completedAlerts: r.completedAlerts ?? base.completedAlerts,
  }
}

function stateFromDb(tasks: DbTask[], pinnedTasks: DbPinnedTask[], completions: DbPinnedCompletion[]): TrackerState {
  const base = createInitialState()
  const tasksByDate: TrackerState['tasksByDate'] = {}
  const pinned = emptyPinnedMap()
  const pinnedCompletion: TrackerState['pinnedCompletion'] = {}

  for (const row of [...tasks].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))) {
    const dateKey = row.task_date
    const category = row.category
    if (!tasksByDate[dateKey]) tasksByDate[dateKey] = emptyCategoryMap()
    tasksByDate[dateKey][category].push({
      id: row.id,
      title: row.title,
      time: row.task_time,
      completed: !!row.completed,
    })
  }

  for (const row of [...pinnedTasks].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))) {
    pinned[row.category].push({
      id: row.id,
      title: row.title,
      time: row.task_time,
    })
  }

  for (const row of completions) {
    if (!pinnedCompletion[row.task_date]) pinnedCompletion[row.task_date] = {}
    pinnedCompletion[row.task_date][row.pinned_task_id] = !!row.completed
  }

  return { ...base, tasksByDate, pinned, pinnedCompletion }
}

async function loadFromSupabase(): Promise<TrackerState> {
  if (!supabase) return createInitialState()

  const [tasksResult, pinnedResult, completionResult] = await Promise.all([
    supabase.from('tasks').select('id,title,task_date,task_time,category,completed,sort_order').order('task_date').order('sort_order'),
    supabase.from('pinned_tasks').select('id,title,task_time,category,sort_order').order('sort_order'),
    supabase.from('pinned_completion').select('task_date,pinned_task_id,completed'),
  ])

  if (tasksResult.error) throw tasksResult.error
  if (pinnedResult.error) throw pinnedResult.error
  if (completionResult.error) throw completionResult.error

  return stateFromDb(
    (tasksResult.data ?? []) as DbTask[],
    (pinnedResult.data ?? []) as DbPinnedTask[],
    (completionResult.data ?? []) as DbPinnedCompletion[],
  )
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
  const [loading, setLoading] = useState(true)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalInfo | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setSyncError(null)

      if (isSupabaseConfigured) {
        try {
          const remoteState = await loadFromSupabase()
          if (!cancelled) {
            setState((prev) => ({ ...remoteState, view: prev.view, selectedDate: prev.selectedDate, completedAlerts: prev.completedAlerts }))
          }
        } catch (error) {
          console.error(error)
          const message = error instanceof Error ? error.message : 'Unknown error'
          if (!cancelled) setSyncError(`Не получилось загрузить задачи из Supabase: ${message}`)
        }
      } else {
        try {
          const stored = localStorage.getItem(STORAGE_KEY)
          if (stored && !cancelled) setState(reviveState(JSON.parse(stored)))
        } catch {
          /* ignore corrupt storage */
        }
      }

      if (!cancelled) {
        setHydrated(true)
        setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  // Local fallback only when Supabase variables are not configured.
  useEffect(() => {
    if (!hydrated || isSupabaseConfigured) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore quota errors */
    }
  }, [state, hydrated])

  const update = useCallback((producer: (prev: TrackerState) => TrackerState) => {
    setState(producer)
  }, [])

  const reportError = useCallback((error: unknown) => {
    console.error(error)
    setSyncError('Не получилось сохранить изменения. Обнови страницу и попробуй ещё раз.')
  }, [])

  const getUnpinned = useCallback(
    (category: CategoryId, dateKey: string): Task[] => state.tasksByDate[dateKey]?.[category] ?? [],
    [state.tasksByDate],
  )

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

  const getDayTasks = useCallback(
    (category: CategoryId, dateKey: string): DayTask[] => {
      const pinned = getPinnedForDay(category, dateKey)
      const unpinned = getUnpinned(category, dateKey).map((t) => ({ ...t, pinned: false }))
      return [...pinned, ...unpinned]
    },
    [getPinnedForDay, getUnpinned],
  )

  const learnSuggestion = (prev: TrackerState, category: CategoryId, title: string): string[] => {
    const list = prev.suggestions[category]
    const exists = list.some((s) => s.toLowerCase() === title.toLowerCase())
    if (exists || !title) return list
    return [...list, title]
  }

  const addTaskForDate = useCallback(
    async (category: CategoryId, dateKey: string, raw: string) => {
      const { time, title } = parseTaskInput(raw)
      if (!title) return
      const tempId = uid()
      const sortOrder = Date.now()
      const newTask: Task = { id: tempId, title, time, completed: false }

      update((prev) => {
        const day = prev.tasksByDate[dateKey] ?? emptyCategoryMap()
        return {
          ...prev,
          tasksByDate: { ...prev.tasksByDate, [dateKey]: { ...day, [category]: [...day[category], newTask] } },
          suggestions: { ...prev.suggestions, [category]: learnSuggestion(prev, category, title) },
        }
      })

      if (!supabase) return
      const { data, error } = await supabase
        .from('tasks')
        .insert({ title, task_date: dateKey, task_time: time, category, completed: false, sort_order: sortOrder })
        .select('id')
        .single()

      if (error || !data) {
        reportError(error)
        return
      }

      update((prev) => {
        const day = prev.tasksByDate[dateKey] ?? emptyCategoryMap()
        return {
          ...prev,
          tasksByDate: {
            ...prev.tasksByDate,
            [dateKey]: {
              ...day,
              [category]: day[category].map((t) => (t.id === tempId ? { ...t, id: data.id } : t)),
            },
          },
        }
      })
    },
    [reportError, update],
  )

  const toggleTask = useCallback(
    async (category: CategoryId, dateKey: string, taskId: string, isPinned: boolean) => {
      let nextCompleted = false
      update((prev) => {
        if (isPinned) {
          const dayCompletion = prev.pinnedCompletion[dateKey] ?? {}
          nextCompleted = !dayCompletion[taskId]
          return {
            ...prev,
            pinnedCompletion: { ...prev.pinnedCompletion, [dateKey]: { ...dayCompletion, [taskId]: nextCompleted } },
          }
        }
        const day = prev.tasksByDate[dateKey] ?? emptyCategoryMap()
        const current = day[category].find((t) => t.id === taskId)
        nextCompleted = !current?.completed
        return {
          ...prev,
          tasksByDate: {
            ...prev.tasksByDate,
            [dateKey]: { ...day, [category]: day[category].map((t) => (t.id === taskId ? { ...t, completed: nextCompleted } : t)) },
          },
        }
      })

      if (!supabase) return
      const result = isPinned
        ? await supabase.from('pinned_completion').upsert({ task_date: dateKey, pinned_task_id: taskId, completed: nextCompleted }, { onConflict: 'task_date,pinned_task_id' })
        : await supabase.from('tasks').update({ completed: nextCompleted, updated_at: new Date().toISOString() }).eq('id', taskId)
      if (result.error) reportError(result.error)
    },
    [reportError, update],
  )

  const deleteTask = useCallback(
    async (category: CategoryId, dateKey: string, taskId: string, isPinned: boolean) => {
      update((prev) => {
        if (isPinned) {
          return { ...prev, pinned: { ...prev.pinned, [category]: prev.pinned[category].filter((p) => p.id !== taskId) } }
        }
        const day = prev.tasksByDate[dateKey] ?? emptyCategoryMap()
        return {
          ...prev,
          tasksByDate: { ...prev.tasksByDate, [dateKey]: { ...day, [category]: day[category].filter((t) => t.id !== taskId) } },
        }
      })

      if (!supabase) return
      const result = isPinned
        ? await supabase.from('pinned_tasks').delete().eq('id', taskId)
        : await supabase.from('tasks').delete().eq('id', taskId)
      if (result.error) reportError(result.error)
    },
    [reportError, update],
  )

  const editTask = useCallback(
    async (category: CategoryId, dateKey: string, taskId: string, isPinned: boolean, newTitle: string, newTime: string | null) => {
      const title = newTitle.trim()
      if (!title) return
      update((prev) => {
        if (isPinned) {
          return {
            ...prev,
            pinned: { ...prev.pinned, [category]: prev.pinned[category].map((p) => (p.id === taskId ? { ...p, title, time: newTime } : p)) },
            suggestions: { ...prev.suggestions, [category]: learnSuggestion(prev, category, title) },
          }
        }
        const day = prev.tasksByDate[dateKey] ?? emptyCategoryMap()
        return {
          ...prev,
          tasksByDate: {
            ...prev.tasksByDate,
            [dateKey]: { ...day, [category]: day[category].map((t) => (t.id === taskId ? { ...t, title, time: newTime } : t)) },
          },
          suggestions: { ...prev.suggestions, [category]: learnSuggestion(prev, category, title) },
        }
      })

      if (!supabase) return
      const result = isPinned
        ? await supabase.from('pinned_tasks').update({ title, task_time: newTime, updated_at: new Date().toISOString() }).eq('id', taskId)
        : await supabase.from('tasks').update({ title, task_time: newTime, updated_at: new Date().toISOString() }).eq('id', taskId)
      if (result.error) reportError(result.error)
    },
    [reportError, update],
  )

  const togglePin = useCallback(
    async (category: CategoryId, dateKey: string, taskId: string, isPinned: boolean) => {
      const prevState = state
      if (isPinned) {
        const pinnedTask = prevState.pinned[category].find((x) => x.id === taskId)
        if (!pinnedTask) return
        const restoredTempId = uid()
        update((prev) => {
          const day = prev.tasksByDate[dateKey] ?? emptyCategoryMap()
          const restored: Task = { id: restoredTempId, title: pinnedTask.title, time: pinnedTask.time, completed: false }
          return {
            ...prev,
            pinned: { ...prev.pinned, [category]: prev.pinned[category].filter((x) => x.id !== taskId) },
            tasksByDate: { ...prev.tasksByDate, [dateKey]: { ...day, [category]: [...day[category], restored] } },
          }
        })
        if (!supabase) return
        const { data, error } = await supabase
          .from('tasks')
          .insert({ title: pinnedTask.title, task_date: dateKey, task_time: pinnedTask.time, category, completed: false, sort_order: Date.now() })
          .select('id')
          .single()
        if (error || !data) {
          reportError(error)
          return
        }
        const deleteResult = await supabase.from('pinned_tasks').delete().eq('id', taskId)
        if (deleteResult.error) reportError(deleteResult.error)
        update((prev) => {
          const day = prev.tasksByDate[dateKey] ?? emptyCategoryMap()
          return {
            ...prev,
            tasksByDate: {
              ...prev.tasksByDate,
              [dateKey]: { ...day, [category]: day[category].map((t) => (t.id === restoredTempId ? { ...t, id: data.id } : t)) },
            },
          }
        })
        return
      }

      const day = prevState.tasksByDate[dateKey] ?? emptyCategoryMap()
      const task = day[category].find((x) => x.id === taskId)
      if (!task) return
      const pinnedTempId = uid()
      update((prev) => {
        const currentDay = prev.tasksByDate[dateKey] ?? emptyCategoryMap()
        const newPinned: PinnedTask = { id: pinnedTempId, title: task.title, time: task.time }
        const dayCompletion = prev.pinnedCompletion[dateKey] ?? {}
        return {
          ...prev,
          pinned: { ...prev.pinned, [category]: [...prev.pinned[category], newPinned] },
          tasksByDate: { ...prev.tasksByDate, [dateKey]: { ...currentDay, [category]: currentDay[category].filter((x) => x.id !== taskId) } },
          pinnedCompletion: { ...prev.pinnedCompletion, [dateKey]: { ...dayCompletion, [pinnedTempId]: task.completed } },
        }
      })
      if (!supabase) return
      const { data, error } = await supabase
        .from('pinned_tasks')
        .insert({ title: task.title, task_time: task.time, category, sort_order: Date.now() })
        .select('id')
        .single()
      if (error || !data) {
        reportError(error)
        return
      }
      const [deleteResult, completionResult] = await Promise.all([
        supabase.from('tasks').delete().eq('id', taskId),
        supabase.from('pinned_completion').upsert({ task_date: dateKey, pinned_task_id: data.id, completed: task.completed }, { onConflict: 'task_date,pinned_task_id' }),
      ])
      if (deleteResult.error) reportError(deleteResult.error)
      if (completionResult.error) reportError(completionResult.error)
      update((prev) => {
        const dayCompletion = prev.pinnedCompletion[dateKey] ?? {}
        const { [pinnedTempId]: tempCompletion, ...restCompletion } = dayCompletion
        return {
          ...prev,
          pinned: { ...prev.pinned, [category]: prev.pinned[category].map((p) => (p.id === pinnedTempId ? { ...p, id: data.id } : p)) },
          pinnedCompletion: { ...prev.pinnedCompletion, [dateKey]: { ...restCompletion, [data.id]: tempCompletion ?? task.completed } },
        }
      })
    },
    [reportError, state, update],
  )

  const reorderTasks = useCallback(
    async (category: CategoryId, group: 'pinned' | 'unpinned', dateKey: string, fromId: string, toId: string) => {
      if (fromId === toId) return
      let orderedIds: string[] = []
      update((prev) => {
        if (group === 'pinned') {
          const arr = [...prev.pinned[category]]
          const from = arr.findIndex((x) => x.id === fromId)
          const to = arr.findIndex((x) => x.id === toId)
          if (from === -1 || to === -1) return prev
          const [moved] = arr.splice(from, 1)
          arr.splice(to, 0, moved)
          orderedIds = arr.map((x) => x.id)
          return { ...prev, pinned: { ...prev.pinned, [category]: arr } }
        }
        const day = prev.tasksByDate[dateKey] ?? emptyCategoryMap()
        const arr = [...day[category]]
        const from = arr.findIndex((x) => x.id === fromId)
        const to = arr.findIndex((x) => x.id === toId)
        if (from === -1 || to === -1) return prev
        const [moved] = arr.splice(from, 1)
        arr.splice(to, 0, moved)
        orderedIds = arr.map((x) => x.id)
        return { ...prev, tasksByDate: { ...prev.tasksByDate, [dateKey]: { ...day, [category]: arr } } }
      })

      if (!supabase || orderedIds.length === 0) return
      const client = supabase
      const table = group === 'pinned' ? 'pinned_tasks' : 'tasks'
      const results = await Promise.all(orderedIds.map((id, index) => client.from(table).update({ sort_order: index }).eq('id', id)))
      const failed = results.find((result) => result.error)
      if (failed?.error) reportError(failed.error)
    },
    [reportError, update],
  )

  const clearDay = useCallback(
    async (dateKey: string) => {
      update((prev) => {
        const next = { ...prev.tasksByDate }
        delete next[dateKey]
        const nextPinnedCompletion = { ...prev.pinnedCompletion }
        delete nextPinnedCompletion[dateKey]
        return {
          ...prev,
          tasksByDate: next,
          pinnedCompletion: nextPinnedCompletion,
          completedAlerts: prev.completedAlerts.filter((a) => !a.startsWith(`${dateKey}:`)),
        }
      })
      if (!supabase) return
      const [tasksResult, pinnedResult] = await Promise.all([
        supabase.from('tasks').delete().eq('task_date', dateKey),
        supabase.from('pinned_completion').delete().eq('task_date', dateKey),
      ])
      if (tasksResult.error) reportError(tasksResult.error)
      if (pinnedResult.error) reportError(pinnedResult.error)
    },
    [reportError, update],
  )

  const setView = useCallback((view: ViewMode) => update((p) => {
    if (view === 'day') {
      const offset = dayOffsetFromToday(p.selectedDate)
      return { ...p, view, selectedDate: offset >= -1 && offset <= 1 ? p.selectedDate : todayKey() }
    }
    return { ...p, view }
  }), [update])

  const setSelectedDate = useCallback((selectedDate: string) => update((p) => ({ ...p, selectedDate })), [update])

  const goPrev = useCallback(() => {
    update((p) => {
      if (p.view === 'day' && dayOffsetFromToday(p.selectedDate) <= -1) return p
      const step = p.view === 'day' ? addDays(p.selectedDate, -1) : addDays(p.selectedDate, -7)
      return { ...p, selectedDate: step }
    })
  }, [update])

  const goNext = useCallback(() => {
    update((p) => {
      if (p.view === 'day' && dayOffsetFromToday(p.selectedDate) >= 1) return p
      const step = p.view === 'day' ? addDays(p.selectedDate, 1) : addDays(p.selectedDate, 7)
      return { ...p, selectedDate: step }
    })
  }, [update])

  const goToday = useCallback(() => update((p) => ({ ...p, selectedDate: todayKey() })), [update])

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
    const perCat = CATEGORIES.map((c) => ({ id: c.id, tasks: getDayTasks(c.id, dateKey) }))
    const withTasks = perCat.filter((x) => x.tasks.length > 0)
    if (withTasks.length === 0) return
    const completeCats = withTasks.filter((x) => x.tasks.every((t) => t.completed))
    const everythingDone = completeCats.length === withTasks.length

    if (everythingDone) {
      const token = `${dateKey}:all`
      if (!alertsRef.current.includes(token)) {
        setModal({ type: 'all' })
        const newTokens = [token, ...withTasks.map((x) => `${dateKey}:${x.id}`)]
        update((p) => ({ ...p, completedAlerts: Array.from(new Set([...p.completedAlerts, ...newTokens])) }))
      }
      return
    }

    for (const c of completeCats) {
      const token = `${dateKey}:${c.id}`
      if (!alertsRef.current.includes(token)) {
        setModal({ type: 'category', category: c.id })
        update((p) => ({ ...p, completedAlerts: Array.from(new Set([...p.completedAlerts, token])) }))
        break
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completionSignature, hydrated])

  return {
    state,
    hydrated,
    loading,
    syncError,
    modal,
    dismissModal: () => setModal(null),
    getUnpinned,
    getDayTasks,
    categoryProgress,
    overallProgress,
    addTaskForDate,
    toggleTask,
    deleteTask,
    editTask,
    togglePin,
    reorderTasks,
    clearDay,
    setView,
    setSelectedDate,
    goPrev,
    goNext,
    goToday,
  }
}

export type TrackerApi = ReturnType<typeof useTracker>
