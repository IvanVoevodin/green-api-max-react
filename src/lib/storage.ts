import type { Credentials } from '../api/types'
import type { ChatsState } from '../state/types'

/*
 * sessionStorage, not localStorage: the data survives a page reload but is
 * dropped when the tab is closed, so apiTokenInstance doesn't stay on disk
 * indefinitely. Any script running on the page can still read it, which
 * only a backend holding the token could prevent.
 */
const CREDENTIALS_KEY = 'max-chat:credentials'
const CHATS_KEY = 'max-chat:chats'

function read<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown): void {
  try {
    if (value === null) sessionStorage.removeItem(key)
    else sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage may be unavailable (private mode, quota); the app still works in memory.
  }
}

export function loadCredentials(): Credentials | null {
  const value = read<Credentials>(CREDENTIALS_KEY)
  return value?.apiUrl && value.idInstance && value.apiTokenInstance ? value : null
}

export function saveCredentials(credentials: Credentials | null): void {
  write(CREDENTIALS_KEY, credentials)
}

export function loadChats(): ChatsState | null {
  const value = read<ChatsState>(CHATS_KEY)
  if (!value || typeof value.chats !== 'object') return null
  // A message still "sending" when the page was closed never got a response.
  for (const chat of Object.values(value.chats)) {
    chat.messages = chat.messages.map((m) => (m.status === 'sending' ? { ...m, status: 'failed' } : m))
  }
  return value
}

export function saveChats(state: ChatsState | null): void {
  write(CHATS_KEY, state)
}
