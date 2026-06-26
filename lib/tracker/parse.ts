// Normalize a time string to "HH.MM" dot format. Returns null if invalid.
export function normalizeTime(raw: string): string | null {
  const cleaned = raw.trim().replace(/[:．。]/g, '.')
  const match = cleaned.match(/^(\d{1,2})\.(\d{1,2})$/)
  if (!match) return null
  let h = parseInt(match[1], 10)
  let m = parseInt(match[2], 10)
  if (isNaN(h) || isNaN(m) || h > 23 || m > 59) return null
  return `${String(h).padStart(2, '0')}.${String(m).padStart(2, '0')}`
}

export function capitalize(text: string): string {
  const t = text.trim()
  if (!t) return t
  return t.charAt(0).toUpperCase() + t.slice(1)
}

// Parse a raw input like "09.30 прогулка" or "14:00 созвон" or "прогулка"
// into { time, title }.
export function parseTaskInput(raw: string): { time: string | null; title: string } {
  const trimmed = raw.trim()
  if (!trimmed) return { time: null, title: '' }

  const parts = trimmed.split(/\s+/)
  const maybeTime = normalizeTime(parts[0])
  if (maybeTime && parts.length > 1) {
    return { time: maybeTime, title: capitalize(parts.slice(1).join(' ')) }
  }
  // also handle case where whole thing is just a time -> keep as title
  return { time: null, title: capitalize(trimmed) }
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}
