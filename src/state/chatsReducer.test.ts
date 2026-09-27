import { describe, expect, it } from 'vitest'
import { chatsReducer, initialChatsState, selectChatList } from './chatsReducer'
import type { Message } from './types'

function message(overrides: Partial<Message> = {}): Message {
  return {
    id: 'm1',
    chatId: '100',
    text: 'Привет',
    timestamp: 1000,
    direction: 'in',
    ...overrides,
  }
}

describe('chatsReducer', () => {
  it('opens a new chat and makes it active', () => {
    const state = chatsReducer(initialChatsState, {
      type: 'chatOpened',
      chatId: '100',
      phone: '79991234567',
      now: 5,
    })
    expect(state.activeChatId).toBe('100')
    expect(state.chats['100']).toEqual({
      chatId: '100',
      phone: '79991234567',
      name: undefined,
      messages: [],
      updatedAt: 5,
    })
  })

  it('reopening an existing chat keeps its messages', () => {
    let state = chatsReducer(initialChatsState, { type: 'messageAdded', message: message() })
    state = chatsReducer(state, { type: 'chatOpened', chatId: '100', phone: '79991234567' })
    expect(state.chats['100'].messages).toHaveLength(1)
    expect(state.chats['100'].phone).toBe('79991234567')
  })

  it('creates a chat for a message from an unknown sender', () => {
    const state = chatsReducer(initialChatsState, {
      type: 'messageAdded',
      message: message(),
      chatName: 'Иван',
    })
    expect(state.chats['100'].name).toBe('Иван')
    expect(state.activeChatId).toBeNull()
  })

  it('ignores duplicate messages', () => {
    const first = chatsReducer(initialChatsState, { type: 'messageAdded', message: message() })
    const second = chatsReducer(first, { type: 'messageAdded', message: message() })
    expect(second).toBe(first)
  })

  it('keeps messages ordered by time and bumps the chat', () => {
    let state = chatsReducer(initialChatsState, {
      type: 'messageAdded',
      message: message({ id: 'b', timestamp: 2000 }),
    })
    state = chatsReducer(state, { type: 'messageAdded', message: message({ id: 'a', timestamp: 1000 }) })
    state = chatsReducer(state, {
      type: 'messageAdded',
      message: message({ id: 'c', chatId: '200', timestamp: 3000 }),
    })

    expect(state.chats['100'].messages.map((m) => m.id)).toEqual(['a', 'b'])
    expect(selectChatList(state).map((c) => c.chatId)).toEqual(['200', '100'])
  })

  it('replaces the local id with idMessage once sent', () => {
    let state = chatsReducer(initialChatsState, {
      type: 'messageAdded',
      message: message({ id: 'local-1', direction: 'out', status: 'sending' }),
    })
    state = chatsReducer(state, { type: 'messageSent', chatId: '100', localId: 'local-1', idMessage: 'srv-1' })
    expect(state.chats['100'].messages).toEqual([
      expect.objectContaining({ id: 'srv-1', status: 'sent' }),
    ])
  })

  it('drops the local copy if the API echo arrived first', () => {
    let state = chatsReducer(initialChatsState, {
      type: 'messageAdded',
      message: message({ id: 'local-1', direction: 'out', status: 'sending' }),
    })
    state = chatsReducer(state, {
      type: 'messageAdded',
      message: message({ id: 'srv-1', direction: 'out', status: 'sent', timestamp: 1001 }),
    })
    state = chatsReducer(state, { type: 'messageSent', chatId: '100', localId: 'local-1', idMessage: 'srv-1' })
    expect(state.chats['100'].messages.map((m) => m.id)).toEqual(['srv-1'])
  })

  it('marks a message as failed', () => {
    let state = chatsReducer(initialChatsState, {
      type: 'messageAdded',
      message: message({ id: 'local-1', direction: 'out', status: 'sending' }),
    })
    state = chatsReducer(state, { type: 'messageFailed', chatId: '100', localId: 'local-1' })
    expect(state.chats['100'].messages[0].status).toBe('failed')
  })
})
