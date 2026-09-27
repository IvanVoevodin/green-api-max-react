import type { Chat, ChatsState, Message } from './types'

export type ChatsAction =
  | { type: 'chatOpened'; chatId: string; phone?: string; name?: string; now?: number }
  | { type: 'chatSelected'; chatId: string | null }
  | { type: 'messageAdded'; message: Message; chatName?: string }
  | { type: 'messageSent'; chatId: string; localId: string; idMessage: string }
  | { type: 'messageFailed'; chatId: string; localId: string }

export const initialChatsState: ChatsState = { chats: {}, activeChatId: null }

function updateChat(state: ChatsState, chatId: string, update: (chat: Chat) => Chat): ChatsState {
  const chat = state.chats[chatId]
  if (!chat) return state
  return { ...state, chats: { ...state.chats, [chatId]: update(chat) } }
}

export function chatsReducer(state: ChatsState, action: ChatsAction): ChatsState {
  switch (action.type) {
    case 'chatOpened': {
      const existing = state.chats[action.chatId]
      const chat: Chat = existing
        ? {
            ...existing,
            phone: existing.phone ?? action.phone,
            name: existing.name ?? action.name,
          }
        : {
            chatId: action.chatId,
            phone: action.phone,
            name: action.name,
            messages: [],
            updatedAt: action.now ?? Date.now(),
          }
      return { chats: { ...state.chats, [action.chatId]: chat }, activeChatId: action.chatId }
    }

    case 'chatSelected':
      return { ...state, activeChatId: action.chatId }

    case 'messageAdded': {
      const { message, chatName } = action
      const existing: Chat = state.chats[message.chatId] ?? {
        chatId: message.chatId,
        messages: [],
        updatedAt: message.timestamp,
      }
      if (existing.messages.some((m) => m.id === message.id)) return state

      const messages = [...existing.messages, message].sort((a, b) => a.timestamp - b.timestamp)
      const chat: Chat = {
        ...existing,
        name: existing.name ?? chatName,
        messages,
        updatedAt: Math.max(existing.updatedAt, message.timestamp),
      }
      return { ...state, chats: { ...state.chats, [chat.chatId]: chat } }
    }

    case 'messageSent':
      return updateChat(state, action.chatId, (chat) => {
        // The API echo (outgoingAPIMessageReceived) may have arrived before the send response.
        const echoed = chat.messages.some((m) => m.id === action.idMessage)
        return {
          ...chat,
          messages: echoed
            ? chat.messages.filter((m) => m.id !== action.localId)
            : chat.messages.map((m) =>
                m.id === action.localId ? { ...m, id: action.idMessage, status: 'sent' } : m,
              ),
        }
      })

    case 'messageFailed':
      return updateChat(state, action.chatId, (chat) => ({
        ...chat,
        messages: chat.messages.map((m) =>
          m.id === action.localId ? { ...m, status: 'failed' } : m,
        ),
      }))
  }
}

/** Chats ordered by latest activity, newest first. */
export function selectChatList(state: ChatsState): Chat[] {
  return Object.values(state.chats).sort((a, b) => b.updatedAt - a.updatedAt)
}
