import { vi } from 'vitest'
import type { NotificationBody, ReceivedNotification } from '../api/types'

/** Resolves once the queue has an item, rejects when the request is aborted (like a real long poll). */
export class NotificationQueue {
  private items: ReceivedNotification[] = []
  private waiters: Array<() => void> = []
  private nextReceiptId = 1

  push(body: NotificationBody): void {
    this.items.push({ receiptId: this.nextReceiptId++, body })
    this.waiters.splice(0).forEach((wake) => wake())
  }

  async receive(signal?: AbortSignal): Promise<ReceivedNotification> {
    while (this.items.length === 0) {
      await new Promise<void>((resolve, reject) => {
        if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'))
        this.waiters.push(resolve)
        signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
      })
    }
    // Stays in the queue until deleted, as in GREEN-API.
    return this.items[0]
  }

  delete(receiptId: number): boolean {
    const index = this.items.findIndex((item) => item.receiptId === receiptId)
    if (index === -1) return false
    this.items.splice(index, 1)
    return true
  }
}

export function incomingText(chatId: string, text: string, idMessage: string, senderName = 'Иван'): NotificationBody {
  return {
    typeWebhook: 'incomingMessageReceived',
    timestamp: Math.floor(Date.now() / 1000),
    idMessage,
    senderData: { chatId, sender: chatId, senderName, chatName: senderName },
    messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: text } },
  }
}

interface FakeApiOptions {
  stateInstance?: string
  accounts?: Record<number, string>
}

/** A `fetch` replacement that emulates the GREEN-API endpoints used by the app. */
export function createFakeGreenApi({ stateInstance = 'authorized', accounts = {} }: FakeApiOptions = {}) {
  const queue = new NotificationQueue()
  let sent = 0

  const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })

  const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
    const url = new URL(String(input))
    const method = url.pathname.split('/')[2]
    const body = init?.body ? JSON.parse(String(init.body)) : undefined

    switch (method) {
      case 'getStateInstance':
        return json({ stateInstance })
      case 'checkAccount': {
        const chatId = accounts[body.phoneNumber]
        return json({ exist: Boolean(chatId), chatId: chatId ?? '' })
      }
      case 'sendMessage':
        return json({ idMessage: `sent-${++sent}` })
      case 'receiveNotification':
        return json(await queue.receive(init?.signal ?? undefined))
      case 'deleteNotification':
        return json({ result: queue.delete(Number(url.pathname.split('/').at(-1))) })
      default:
        return new Response('', { status: 404 })
    }
  })

  function callsTo(method: string) {
    return fetchMock.mock.calls.filter(([input]) => String(input).includes(`/${method}/`))
  }

  return { fetchMock, queue, callsTo }
}
