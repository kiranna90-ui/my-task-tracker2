export type CategoryId = 'personal' | 'work' | 'family'

export type ViewMode = 'day' | 'week'

export interface Category {
  id: CategoryId
  title: string
  icon: string
  // adjective used in completion modal, e.g. "личные"
  adjective: string
}

export interface Task {
  id: string
  title: string
  time: string | null // formatted "09.30" or null
  completed: boolean
}

export interface PinnedTask {
  id: string
  title: string
  time: string | null
}

// Regular (unpinned) tasks: keyed by date -> category -> Task[]
export type TasksByDate = Record<string, Record<CategoryId, Task[]>>

// Pinned tasks live once per category and repeat every day
export type PinnedTasksByCategory = Record<CategoryId, PinnedTask[]>

// Completion state for pinned tasks: date -> pinnedTaskId -> boolean
export type PinnedCompletion = Record<string, Record<string, boolean>>

export type SuggestionsByCategory = Record<CategoryId, string[]>

export interface TrackerState {
  tasksByDate: TasksByDate
  pinned: PinnedTasksByCategory
  pinnedCompletion: PinnedCompletion
  suggestions: SuggestionsByCategory
  view: ViewMode
  selectedDate: string // YYYY-MM-DD
  completedAlerts: string[] // tokens like "2026-06-25:personal" or "2026-06-25:all"
}

export const CATEGORIES: Category[] = [
  { id: 'personal', title: 'Личное', icon: '🌷', adjective: 'личные' },
  { id: 'work', title: 'Работа', icon: '💻', adjective: 'рабочие' },
  { id: 'family', title: 'Семья', icon: '🏡', adjective: 'семейные' },
]

export const DEFAULT_SUGGESTIONS: SuggestionsByCategory = {
  personal: ['Уход за собой', 'Прогулка', 'Спорт', 'Вода', 'Отдых'],
  work: ['Проверить почту', 'Созвон', 'Отчёт', 'План на день', 'Закрыть задачу'],
  family: ['Позвонить', 'Купить продукты', 'Помочь дома', 'Провести время вместе', 'Запланировать дела'],
}

export const QUOTES = [
  'Ты уже молодец, что открыла этот трекер ⭐',
  'Маленькие шаги ведут к большим результатам 🌿',
  'Сегодня отличный день, чтобы позаботиться о себе 💕',
  'Делай что можешь, с тем что есть, там где ты есть ✨',
  'Каждая выполненная задача — повод гордиться собой 🌸',
  'Не идеально, а с любовью к себе 💜',
  'Ты справляешься лучше, чем тебе кажется 🌷',
]
