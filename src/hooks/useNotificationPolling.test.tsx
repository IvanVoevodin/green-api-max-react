import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { GreenApiClient } from '../api/greenApi'
import { incomingText, NotificationQueue } from '../test/fakeGreenApi'
import { useNotificationPolling } from './useNotificationPolling'

function createFakeClient(queue: NotificationQueue) {
  return {
    getStateInstance: vi.fn(),
    checkAccount: vi.fn(),
    sendMessage: vi.fn(),
    receiveNotification: vi.fn((_timeout?: number, signal?: AbortSignal) => queue.receive(signal)),
    deleteNotification: vi.fn(async (receiptId: number) => ({ result: queue.delete(receiptId) })),
  } satisfies GreenApiClient
}

describe('useNotificationPolling', () => {
  it('passes text messages to the handler and deletes them from the queue', async () => {
    const queue = new NotificationQueue()
    const client = createFakeClient(queue)
    const onMessage = vi.fn()
    renderHook(() => useNotificationPolling(client, onMessage))

    queue.push(incomingText('100', 'Привет', 'm1'))

    await waitFor(() => expect(client.deleteNotification).toHaveBeenCalledWith(1, expect.any(AbortSignal)))
    expect(onMessage).toHaveBeenCalledTimes(1)
    expect(onMessage.mock.calls[0][0].message).toMatchObject({ chatId: '100', text: 'Привет' })
  })

  it('deletes notifications it does not display', async () => {
    const queue = new NotificationQueue()
    const client = createFakeClient(queue)
    const onMessage = vi.fn()
    renderHook(() => useNotificationPolling(client, onMessage))

    queue.push({ typeWebhook: 'stateInstanceChanged' })
    queue.push(incomingText('100', 'Второе', 'm2'))

    await waitFor(() => expect(client.deleteNotification).toHaveBeenCalledTimes(2))
    expect(onMessage).toHaveBeenCalledTimes(1)
  })

  it('retries after a failed request', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const queue = new NotificationQueue()
    const client = createFakeClient(queue)
    client.receiveNotification.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const onMessage = vi.fn()
    renderHook(() => useNotificationPolling(client, onMessage, { retryDelay: 10 }))

    queue.push(incomingText('100', 'ok', 'm3'))

    await waitFor(() => expect(onMessage).toHaveBeenCalledTimes(1))
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })

  it('stops polling on unmount', async () => {
    const queue = new NotificationQueue()
    const client = createFakeClient(queue)
    const { unmount } = renderHook(() => useNotificationPolling(client, vi.fn()))

    await waitFor(() => expect(client.receiveNotification).toHaveBeenCalledTimes(1))
    const signal = client.receiveNotification.mock.calls[0][1]
    unmount()

    expect(signal?.aborted).toBe(true)
  })

  it('does nothing without a client', () => {
    const onMessage = vi.fn()
    expect(() => renderHook(() => useNotificationPolling(null, onMessage))).not.toThrow()
    expect(onMessage).not.toHaveBeenCalled()
  })
})
