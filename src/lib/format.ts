const timeFormat = new Intl.DateTimeFormat('ru', { hour: '2-digit', minute: '2-digit' })
const shortDateFormat = new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'short' })

function isSameDay(a: number, b: number): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

/** "15:10" */
export function formatTime(ms: number): string {
  return timeFormat.format(ms)
}

/** Chat list: time for today, "26 сент." otherwise. */
export function formatChatDate(ms: number, now = Date.now()): string {
  return isSameDay(ms, now) ? formatTime(ms) : shortDateFormat.format(ms)
}
