import type {
  CheckAccountResponse,
  Credentials,
  ReceivedNotification,
  SendMessageResponse,
  StateInstanceResponse,
} from './types'

export class GreenApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'GreenApiError'
    this.status = status
  }
}

export interface GreenApiClient {
  getStateInstance(signal?: AbortSignal): Promise<StateInstanceResponse>
  checkAccount(phoneNumber: number, signal?: AbortSignal): Promise<CheckAccountResponse>
  sendMessage(chatId: string, message: string, signal?: AbortSignal): Promise<SendMessageResponse>
  receiveNotification(
    receiveTimeout?: number,
    signal?: AbortSignal,
  ): Promise<ReceivedNotification | null>
  deleteNotification(receiptId: number, signal?: AbortSignal): Promise<{ result: boolean }>
}

/**
 * MAX instances are served from a host named after the first four digits of
 * idInstance, e.g. 3100123456 -> https://3100.api.green-api.com.
 * The exact value is shown in the GREEN-API console as "apiUrl".
 */
export function guessApiUrl(idInstance: string): string {
  const digits = idInstance.trim()
  return /^\d{4,}$/.test(digits) ? `https://${digits.slice(0, 4)}.api.green-api.com` : ''
}

export function createGreenApiClient(
  { apiUrl, idInstance, apiTokenInstance }: Credentials,
  fetchImpl: typeof fetch = (...args) => fetch(...args),
): GreenApiClient {
  const base = `${apiUrl.trim().replace(/\/+$/, '')}/waInstance${idInstance.trim()}`
  const token = apiTokenInstance.trim()

  async function request<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    {
      body,
      suffix,
      query,
      signal,
    }: { body?: unknown; suffix?: string; query?: string; signal?: AbortSignal } = {},
  ): Promise<T> {
    const url = `${base}/${path}/${token}${suffix ? `/${suffix}` : ''}${query ? `?${query}` : ''}`
    const response = await fetchImpl(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
    if (!response.ok) {
      throw new GreenApiError(response.status, `GREEN-API ${path}: HTTP ${response.status}`)
    }
    const text = await response.text()
    return (text ? JSON.parse(text) : null) as T
  }

  return {
    getStateInstance: (signal) => request('GET', 'getStateInstance', { signal }),

    checkAccount: (phoneNumber, signal) =>
      request('POST', 'checkAccount', { body: { phoneNumber }, signal }),

    sendMessage: (chatId, message, signal) =>
      request('POST', 'sendMessage', { body: { chatId, message }, signal }),

    receiveNotification: (receiveTimeout = 20, signal) =>
      request('GET', 'receiveNotification', { query: `receiveTimeout=${receiveTimeout}`, signal }),

    deleteNotification: (receiptId, signal) =>
      request('DELETE', 'deleteNotification', { suffix: String(receiptId), signal }),
  }
}
