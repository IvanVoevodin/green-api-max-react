import type { NotificationBody } from '../api/types'
import type { Message } from '../state/types'

export interface ParsedNotification {
  message: Message
  /** Chat title reported by MAX, when known. */
  chatName?: string
}

const INCOMING = new Set(['incomingMessageReceived'])
// outgoingMessageReceived: sent from the phone / another MAX client;
// outgoingAPIMessageReceived: sent through the API (e.g. by this app).
const OUTGOING = new Set(['outgoingMessageReceived', 'outgoingAPIMessageReceived'])

function extractText(body: NotificationBody): string | null {
  const data = body.messageData
  switch (data?.typeMessage) {
    case 'textMessage':
      return data.textMessageData?.textMessage ?? null
    case 'extendedTextMessage':
      return data.extendedTextMessageData?.text ?? null
    default:
      return null
  }
}

/** Converts a GREEN-API notification into a chat message; returns null for anything but text messages. */
export function parseNotification(body: NotificationBody | null | undefined): ParsedNotification | null {
  if (!body) return null
  const incoming = INCOMING.has(body.typeWebhook)
  if (!incoming && !OUTGOING.has(body.typeWebhook)) return null

  const chatId = body.senderData?.chatId
  const text = extractText(body)
  if (!chatId || text === null || !body.idMessage) return null

  const sender = body.senderData
  const chatName = incoming
    ? sender?.chatName || sender?.senderContactName || sender?.senderName
    : sender?.chatName

  return {
    message: {
      id: body.idMessage,
      chatId,
      text,
      timestamp: (body.timestamp ?? Math.floor(Date.now() / 1000)) * 1000,
      direction: incoming ? 'in' : 'out',
      status: incoming ? undefined : 'sent',
    },
    chatName: chatName || undefined,
  }
}
