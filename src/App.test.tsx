import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { createFakeGreenApi, incomingText } from './test/fakeGreenApi'

afterEach(() => vi.unstubAllGlobals())

describe('App', () => {
  it('logs in, creates a chat by phone, sends a message and shows the reply', async () => {
    const api = createFakeGreenApi({ accounts: { 79991234567: '10000000' } })
    vi.stubGlobal('fetch', api.fetchMock)
    const user = userEvent.setup()
    render(<App />)

    // 1. Log in with GREEN-API credentials.
    await user.type(screen.getByLabelText('idInstance'), '3100123456')
    await user.type(screen.getByLabelText('apiTokenInstance'), 'token')
    await user.click(screen.getByRole('button', { name: 'Войти' }))
    expect(await screen.findByRole('heading', { name: 'Чаты' })).toBeInTheDocument()

    // 2. Create a chat by the recipient's phone number.
    await user.click(screen.getByRole('button', { name: 'Новый чат' }))
    await user.type(screen.getByLabelText('Номер телефона'), '+7 999 123 45 67')
    await user.click(screen.getByRole('button', { name: 'Найти в MAX' }))
    const chat = await screen.findByRole('region', { name: 'Чат: +7 999 123-45-67' })

    // 3. Send a text message.
    await user.type(within(chat).getByRole('textbox', { name: 'Сообщение' }), 'Привет из GREEN-API{Enter}')
    await waitFor(() => expect(api.callsTo('sendMessage')).toHaveLength(1))
    expect(JSON.parse(String(api.callsTo('sendMessage')[0][1]?.body))).toEqual({
      chatId: '10000000',
      message: 'Привет из GREEN-API',
    })
    const log = within(chat).getByRole('log')
    await waitFor(() => expect(within(log).getByRole('img', { name: 'Отправлено' })).toBeInTheDocument())

    // 4–5. The recipient replies in MAX and the reply appears in the chat.
    api.queue.push(incomingText('10000000', 'Привет! Получил', 'reply-1', 'Иван Петров'))
    expect(await within(log).findByText('Привет! Получил')).toBeInTheDocument()
    await waitFor(() => expect(api.callsTo('deleteNotification')).toHaveLength(1))

    // The chat takes the sender's name from the notification.
    expect(screen.getByRole('heading', { name: 'Иван Петров' })).toBeInTheDocument()
  })

  it('adds a chat when a message arrives from a new contact', async () => {
    const api = createFakeGreenApi()
    vi.stubGlobal('fetch', api.fetchMock)
    sessionStorage.setItem(
      'max-chat:credentials',
      JSON.stringify({ apiUrl: 'https://3100.api.green-api.com', idInstance: '3100123456', apiTokenInstance: 't' }),
    )
    render(<App />)

    api.queue.push(incomingText('20000000', 'Здравствуйте', 'in-1', 'Мария'))

    const list = screen.getByRole('list', { name: 'Список чатов' })
    expect(await within(list).findByText('Мария')).toBeInTheDocument()
    expect(within(list).getByText('Здравствуйте')).toBeInTheDocument()
  })

  it('logs out and returns to the login screen', async () => {
    vi.stubGlobal('fetch', createFakeGreenApi().fetchMock)
    sessionStorage.setItem(
      'max-chat:credentials',
      JSON.stringify({ apiUrl: 'https://3100.api.green-api.com', idInstance: '3100123456', apiTokenInstance: 't' }),
    )
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Выйти' }))

    expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument()
    expect(sessionStorage.getItem('max-chat:credentials')).toBeNull()
  })
})
