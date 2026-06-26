'use client'

import { useState } from 'react'
import { Check, GripVertical, Pin, PinOff, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CategoryId } from '@/lib/tracker/types'
import type { DayTask, TrackerApi } from '@/lib/tracker/use-tracker'
import { capitalize, normalizeTime } from '@/lib/tracker/parse'

function TaskRow({
  task,
  category,
  dateKey,
  tracker,
  isDragging,
  isOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  task: DayTask
  category: CategoryId
  dateKey: string
  tracker: TrackerApi
  isDragging: boolean
  isOver: boolean
  onDragStart: () => void
  onDragOver: () => void
  onDrop: () => void
  onDragEnd: () => void
}) {
  const handleEdit = () => {
    const nextTitle = window.prompt('Текст задачи:', task.title)
    if (nextTitle === null) return
    const trimmed = nextTitle.trim()
    if (!trimmed) return
    const nextTimeRaw = window.prompt('Время (например 09.30), оставьте пустым чтобы убрать:', task.time ?? '')
    if (nextTimeRaw === null) return
    const nextTime = nextTimeRaw.trim() ? normalizeTime(nextTimeRaw) : null
    tracker.editTask(category, dateKey, task.id, task.pinned, capitalize(trimmed), nextTime)
  }

  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver()
      }}
      onDrop={(e) => {
        e.preventDefault()
        onDrop()
      }}
      onDragEnd={onDragEnd}
      className={cn(
        'group flex items-center gap-2 rounded-2xl px-3 py-2.5 transition-all',
        task.pinned ? 'bg-pink-soft/55 ring-1 ring-pink/40' : 'bg-white/65',
        isDragging && 'opacity-40',
        isOver && 'ring-2 ring-purple/60',
      )}
    >
      <span
        className="cursor-grab text-muted-ink/60 active:cursor-grabbing"
        aria-hidden="true"
      >
        <GripVertical className="h-4 w-4" />
      </span>

      <button
        type="button"
        onClick={() => tracker.toggleTask(category, dateKey, task.id, task.pinned)}
        aria-label={task.completed ? 'Отметить как невыполненную' : 'Отметить как выполненную'}
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition',
          task.completed ? 'btn-gradient border-transparent text-white' : 'border-purple/40 bg-white',
        )}
      >
        {task.completed && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </button>

      <div
        className="min-w-0 flex-1 cursor-text"
        onDoubleClick={handleEdit}
        title="Двойной клик для редактирования"
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'truncate text-sm font-bold',
              task.completed ? 'text-muted-ink line-through' : 'text-ink',
            )}
          >
            {task.title}
          </span>
          {task.time && (
            <span className="ml-auto shrink-0 rounded-full bg-purple/12 px-2 py-0.5 text-xs font-extrabold text-purple">
              {task.time}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => tracker.togglePin(category, dateKey, task.id, task.pinned)}
        aria-label={task.pinned ? 'Открепить' : 'Закрепить'}
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-full transition active:scale-90',
          task.pinned ? 'bg-pink text-white' : 'bg-white/70 text-purple hover:bg-white',
        )}
      >
        {task.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
      </button>

      <button
        type="button"
        onClick={() => tracker.deleteTask(category, dateKey, task.id, task.pinned)}
        aria-label="Удалить задачу"
        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/70 text-pink transition hover:bg-white active:scale-90"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  )
}

// A drag-reorderable list. All tasks in one list share the same group,
// so reordering is naturally constrained to the same category + type.
export function TaskList({
  tasks,
  category,
  dateKey,
  group,
  tracker,
}: {
  tasks: DayTask[]
  category: CategoryId
  dateKey: string
  group: 'pinned' | 'unpinned'
  tracker: TrackerApi
}) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  if (tasks.length === 0) return null

  return (
    <ul className="flex flex-col gap-2">
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          category={category}
          dateKey={dateKey}
          tracker={tracker}
          isDragging={dragId === task.id}
          isOver={overId === task.id && dragId !== task.id}
          onDragStart={() => setDragId(task.id)}
          onDragOver={() => setOverId(task.id)}
          onDrop={() => {
            if (dragId && dragId !== task.id) {
              tracker.reorderTasks(category, group, dateKey, dragId, task.id)
            }
            setDragId(null)
            setOverId(null)
          }}
          onDragEnd={() => {
            setDragId(null)
            setOverId(null)
          }}
        />
      ))}
    </ul>
  )
}
