export type MessageDirection = 'in' | 'out'
export type MessageStatus = 'sending' | 'sent' | 'failed'

export interface Message {
  id: string
  chatId: string
  text: string
  /** Unix time in milliseconds. */
  timestamp: number
  direction: MessageDirection
  status?: MessageStatus
}

export interface Chat {
  chatId: string
  name?: string
  /** Phone number digits with the country code, e.g. "79991234567". */
  phone?: string
  messages: Message[]
  /** Used to sort the chat list, Unix time in milliseconds. */
  updatedAt: number
}

export interface ChatsState {
  chats: Record<string, Chat>
  activeChatId: string | null
}
