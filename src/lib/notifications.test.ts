import { describe, expect, it } from 'vitest'
import type { NotificationBody } from '../api/types'
import { parseNotification } from './notifications'

const incomingText: NotificationBody = {
  typeWebhook: 'incomingMessageReceived',
  timestamp: 1763115112,
  idMessage: '1763115112345',
  senderData: {
    chatId: '10000000',
    chatName: 'Иван Петров',
    sender: '10000000',
    senderName: 'Иван Петров',
  },
  messageData: {
    typeMessage: 'textMessage',
    textMessageData: { textMessage: 'Привет!' },
  },
}

describe('parseNotification', () => {
  it('parses an incoming text message', () => {
    expect(parseNotification(incomingText)).toEqual({
      chatName: 'Иван Петров',
      message: {
        id: '1763115112345',
        chatId: '10000000',
        text: 'Привет!',
        timestamp: 1763115112000,
        direction: 'in',
        status: undefined,
      },
    })
  })

  it('parses an extended text message', () => {
    const parsed = parseNotification({
      ...incomingText,
      messageData: { typeMessage: 'extendedTextMessage', extendedTextMessageData: { text: 'Ссылка' } },
    })
    expect(parsed?.message.text).toBe('Ссылка')
  })

  it('parses messages sent from the phone as outgoing', () => {
    const parsed = parseNotification({ ...incomingText, typeWebhook: 'outgoingMessageReceived' })
    expect(parsed?.message.direction).toBe('out')
    expect(parsed?.message.status).toBe('sent')
  })

  it('ignores non-text messages', () => {
    expect(
      parseNotification({ ...incomingText, messageData: { typeMessage: 'imageMessage' } }),
    ).toBeNull()
  })

  it('ignores status and service notifications', () => {
    expect(parseNotification({ typeWebhook: 'outgoingMessageStatus', idMessage: '1' })).toBeNull()
    expect(parseNotification({ typeWebhook: 'stateInstanceChanged' })).toBeNull()
    expect(parseNotification(null)).toBeNull()
  })
})
