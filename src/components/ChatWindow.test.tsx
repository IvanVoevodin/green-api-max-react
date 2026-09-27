import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Chat } from '../state/types'
import { ChatWindow } from './ChatWindow'

const now = Date.now()

const chat: Chat = {
  chatId: '10000000',
  name: 'Иван Петров',
  phone: '79991234567',
  updatedAt: now,
  messages: [
    { id: '1', chatId: '10000000', text: 'Привет!', timestamp: now, direction: 'in' },
    { id: '2', chatId: '10000000', text: 'Как дела?', timestamp: now, direction: 'out', status: 'sent' },
    { id: '3', chatId: '10000000', text: 'Ошибка', timestamp: now, direction: 'out', status: 'failed' },
  ],
}

describe('ChatWindow', () => {
  it('shows the chat header and messages', () => {
    render(<ChatWindow chat={chat} onSend={vi.fn()} onBack={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Иван Петров' })).toBeInTheDocument()
    expect(screen.getByText('+7 999 123-45-67')).toBeInTheDocument()
    expect(screen.getByText('Привет!').closest('.bubble')).toHaveClass('bubble--in')
    expect(screen.getByText('Как дела?').closest('.bubble')).toHaveClass('bubble--out')
    expect(screen.getByRole('img', { name: 'Не отправлено' })).toBeInTheDocument()
  })

  it('sends a trimmed message on Enter and clears the input', async () => {
    const onSend = vi.fn()
    render(<ChatWindow chat={chat} onSend={onSend} onBack={vi.fn()} />)
    const user = userEvent.setup()
    const input = screen.getByRole('textbox', { name: 'Сообщение' })

    await user.type(input, '  Отлично  {Enter}')

    expect(onSend).toHaveBeenCalledWith('Отлично')
    expect(input).toHaveValue('')
  })

  it('inserts a new line on Shift+Enter', async () => {
    const onSend = vi.fn()
    render(<ChatWindow chat={chat} onSend={onSend} onBack={vi.fn()} />)
    const user = userEvent.setup()
    const input = screen.getByRole('textbox', { name: 'Сообщение' })

    await user.type(input, 'a{Shift>}{Enter}{/Shift}b')

    expect(onSend).not.toHaveBeenCalled()
    expect(input).toHaveValue('a\nb')
  })

  it('does not send empty messages', async () => {
    const onSend = vi.fn()
    render(<ChatWindow chat={chat} onSend={onSend} onBack={vi.fn()} />)
    const user = userEvent.setup()

    expect(screen.getByRole('button', { name: 'Отправить' })).toBeDisabled()
    await user.type(screen.getByRole('textbox', { name: 'Сообщение' }), '   {Enter}')
    expect(onSend).not.toHaveBeenCalled()
  })
})
