const MONTHS_GEN = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

const MONTHS_NOM = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

const WEEKDAYS_FULL = [
  'воскресенье', 'понедельник', 'вторник', 'среда',
  'четверг', 'пятница', 'суббота',
]

// Monday-first weekday short labels
export const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export function toKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayKey(): string {
  return toKey(new Date())
}

export function addDays(key: string, days: number): string {
  const d = fromKey(key)
  d.setDate(d.getDate() + days)
  return toKey(d)
}

export function addMonths(key: string, months: number): string {
  const d = fromKey(key)
  d.setMonth(d.getMonth() + months)
  return toKey(d)
}

// "25 июня, четверг"
export function formatLongDate(key: string): string {
  const d = fromKey(key)
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}, ${WEEKDAYS_FULL[d.getDay()]}`
}

// "Июнь 2026"
export function formatMonthTitle(key: string): string {
  const d = fromKey(key)
  return `${MONTHS_NOM[d.getMonth()]} ${d.getFullYear()}`
}

// Diff in whole days between key and today (key - today)
export function dayOffsetFromToday(key: string): number {
  const a = fromKey(key)
  const b = fromKey(todayKey())
  const ms = a.getTime() - b.getTime()
  return Math.round(ms / 86400000)
}

// Relative label for the "today" button, when within range
export function relativeDayLabel(key: string): string {
  const offset = dayOffsetFromToday(key)
  switch (offset) {
    case -2:
      return 'Позавчера'
    case -1:
      return 'Вчера'
    case 0:
      return 'Сегодня'
    case 1:
      return 'Завтра'
    case 2:
      return 'Послезавтра'
    default:
      return 'Сегодня'
  }
}

// Mon-first index: 0 = Monday ... 6 = Sunday
function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7
}

// Returns the 7 day keys (Mon..Sun) for the week containing key
export function weekDays(key: string): string[] {
  const d = fromKey(key)
  const start = new Date(d)
  start.setDate(d.getDate() - mondayIndex(d))
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(start)
    x.setDate(start.getDate() + i)
    return toKey(x)
  })
}

// "10 – 16 июня" style range label for a week
export function formatWeekRange(key: string): string {
  const days = weekDays(key)
  const a = fromKey(days[0])
  const b = fromKey(days[6])
  if (a.getMonth() === b.getMonth()) {
    return `${a.getDate()} – ${b.getDate()} ${MONTHS_GEN[a.getMonth()]}`
  }
  return `${a.getDate()} ${MONTHS_GEN[a.getMonth()]} – ${b.getDate()} ${MONTHS_GEN[b.getMonth()]}`
}

// "Пн, 10 июня"
export function formatDayLabel(key: string): string {
  const d = fromKey(key)
  const wd = WEEKDAYS_SHORT[(d.getDay() + 6) % 7]
  return `${wd}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`
}

// Calendar grid for the month containing key: array of {key, inMonth}
export function monthGrid(key: string): { key: string; inMonth: boolean }[] {
  const d = fromKey(key)
  const first = new Date(d.getFullYear(), d.getMonth(), 1)
  const startOffset = mondayIndex(first)
  const gridStart = new Date(first)
  gridStart.setDate(first.getDate() - startOffset)
  const month = d.getMonth()
  return Array.from({ length: 42 }, (_, i) => {
    const x = new Date(gridStart)
    x.setDate(gridStart.getDate() + i)
    return { key: toKey(x), inMonth: x.getMonth() === month }
  })
}

// All day keys that belong to the month of key
export function monthDays(key: string): string[] {
  return monthGrid(key)
    .filter((c) => c.inMonth)
    .map((c) => c.key)
}

export { MONTHS_GEN, MONTHS_NOM, WEEKDAYS_FULL }
