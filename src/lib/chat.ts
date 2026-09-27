import type { Chat } from '../state/types'
import { formatPhone } from './phone'

export function getChatTitle(chat: Pick<Chat, 'chatId' | 'name' | 'phone'>): string {
  if (chat.name) return chat.name
  if (chat.phone) return formatPhone(chat.phone)
  return `Чат ${chat.chatId}`
}

/** Initials of the first and last words ("Green API Test" -> "GT"); empty if the title has no letters. */
export function getInitials(title: string): string {
  const letters = title
    .split(/\s+/)
    .map((word) => word.match(/\p{L}/u)?.[0] ?? '')
    .filter(Boolean)
  const initials = letters.length > 1 ? letters[0] + letters.at(-1) : (letters[0] ?? '')
  return initials.toUpperCase()
}

const GRADIENTS = [
  ['#2fd97a', '#10b3a0'],
  ['#8b7cf6', '#5b8def'],
  ['#ff8a65', '#f4506b'],
  ['#4fc3f7', '#2f6bff'],
  ['#f7b733', '#fc4a1a'],
  ['#c471f5', '#fa71cd'],
]

/** Stable avatar background for a chat. */
export function getAvatarGradient(chatId: string): string {
  let hash = 0
  for (const char of chatId) hash = (hash * 31 + char.charCodeAt(0)) | 0
  const [from, to] = GRADIENTS[Math.abs(hash) % GRADIENTS.length]
  return `linear-gradient(135deg, ${from}, ${to})`
}
