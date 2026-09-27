import { describe, expect, it, vi } from 'vitest'
import { createGreenApiClient, GreenApiError, guessApiUrl } from './greenApi'

const credentials = {
  apiUrl: 'https://3100.api.green-api.com/',
  idInstance: '3100123456',
  apiTokenInstance: 'secret-token',
}

function mockFetch(body: unknown, status = 200) {
  return vi.fn<typeof fetch>(async () =>
    new Response(body === null ? '' : JSON.stringify(body), { status }),
  )
}

describe('guessApiUrl', () => {
  it('builds the host from the first four digits of idInstance', () => {
    expect(guessApiUrl('3100123456')).toBe('https://3100.api.green-api.com')
  })

  it('returns an empty string for incomplete input', () => {
    expect(guessApiUrl('31')).toBe('')
    expect(guessApiUrl('abc')).toBe('')
  })
})

describe('createGreenApiClient', () => {
  it('sends a text message with chatId and message in the body', async () => {
    const fetchMock = mockFetch({ idMessage: 'BAE5' })
    const client = createGreenApiClient(credentials, fetchMock)

    await expect(client.sendMessage('10000000', 'Привет')).resolves.toEqual({ idMessage: 'BAE5' })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://3100.api.green-api.com/waInstance3100123456/sendMessage/secret-token')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init?.body as string)).toEqual({ chatId: '10000000', message: 'Привет' })
  })

  it('checks an account with an integer phone number', async () => {
    const fetchMock = mockFetch({ exist: true, chatId: '10000000' })
    const client = createGreenApiClient(credentials, fetchMock)

    await client.checkAccount(79991234567)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/waInstance3100123456/checkAccount/secret-token')
    expect(init?.body).toBe('{"phoneNumber":79991234567}')
  })

  it('receives a notification with the long-poll timeout', async () => {
    const fetchMock = mockFetch({ receiptId: 1, body: { typeWebhook: 'x' } })
    const client = createGreenApiClient(credentials, fetchMock)

    await expect(client.receiveNotification(15)).resolves.toEqual({
      receiptId: 1,
      body: { typeWebhook: 'x' },
    })
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://3100.api.green-api.com/waInstance3100123456/receiveNotification/secret-token?receiveTimeout=15',
    )
    expect(fetchMock.mock.calls[0][1]?.method).toBe('GET')
  })

  it('returns null when the notification queue is empty', async () => {
    const client = createGreenApiClient(credentials, mockFetch(null))
    await expect(client.receiveNotification()).resolves.toBeNull()
  })

  it('deletes a notification by receiptId', async () => {
    const fetchMock = mockFetch({ result: true })
    const client = createGreenApiClient(credentials, fetchMock)

    await client.deleteNotification(42)

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://3100.api.green-api.com/waInstance3100123456/deleteNotification/secret-token/42',
    )
    expect(fetchMock.mock.calls[0][1]?.method).toBe('DELETE')
  })

  it('throws GreenApiError with the HTTP status on failure', async () => {
    const client = createGreenApiClient(credentials, mockFetch({}, 401))
    const error = await client.getStateInstance().catch((e: unknown) => e)
    expect(error).toBeInstanceOf(GreenApiError)
    expect((error as GreenApiError).status).toBe(401)
  })
})
