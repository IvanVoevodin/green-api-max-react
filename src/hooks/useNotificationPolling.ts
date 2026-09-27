import { useEffect, useRef } from 'react'
import type { GreenApiClient } from '../api/greenApi'
import { parseNotification, type ParsedNotification } from '../lib/notifications'

export interface PollingOptions {
  /** Long-poll timeout passed to receiveNotification, seconds (5–60). */
  receiveTimeout?: number
  /** Pause before retrying after a failed request, milliseconds. */
  retryDelay?: number
}

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      resolve()
    })
  })
}

/**
 * Receives notifications through the GREEN-API HTTP API:
 * receiveNotification -> handle -> deleteNotification, in a loop, while `client` is set.
 * Every received notification is deleted, even if it is not a text message,
 * otherwise the queue would return it again.
 */
export function useNotificationPolling(
  client: GreenApiClient | null,
  onMessage: (notification: ParsedNotification) => void,
  { receiveTimeout = 20, retryDelay = 3000 }: PollingOptions = {},
): void {
  const onMessageRef = useRef(onMessage)

  useEffect(() => {
    onMessageRef.current = onMessage
  })

  useEffect(() => {
    if (!client) return
    const controller = new AbortController()
    const { signal } = controller

    async function loop() {
      while (!signal.aborted) {
        try {
          const notification = await client!.receiveNotification(receiveTimeout, signal)
          if (notification) {
            try {
              const parsed = parseNotification(notification.body)
              if (parsed) onMessageRef.current(parsed)
            } finally {
              await client!.deleteNotification(notification.receiptId, signal)
            }
          }
          // Yield to the event loop so an empty response can never spin the loop synchronously.
          await delay(0, signal)
        } catch (error) {
          if (signal.aborted) return
          console.warn('GREEN-API notification polling failed, retrying', error)
          await delay(retryDelay, signal)
        }
      }
    }

    void loop()
    return () => controller.abort()
  }, [client, receiveTimeout, retryDelay])
}
