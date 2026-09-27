import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { NewChatModal } from './NewChatModal'

function setup(checkAccount = vi.fn(async () => ({ exist: true, chatId: '10000000' }))) {
  const onChatFound = vi.fn()
  const onClose = vi.fn()
  render(<NewChatModal checkAccount={checkAccount} onChatFound={onChatFound} onClose={onClose} />)
  return { user: userEvent.setup(), checkAccount, onChatFound, onClose }
}

describe('NewChatModal', () => {
  it('finds a MAX account by phone number and opens the chat', async () => {
    const { user, checkAccount, onChatFound } = setup()

    await user.type(screen.getByLabelText('Номер телефона'), '+7 999 123 45 67')
    await user.click(screen.getByRole('button', { name: 'Найти в MAX' }))

    expect(checkAccount).toHaveBeenCalledWith(79991234567)
    expect(onChatFound).toHaveBeenCalledWith('10000000', '79991234567')
  })

  it('shows an error when the number is not registered in MAX', async () => {
    const { user, onChatFound } = setup(vi.fn(async () => ({ exist: false, chatId: '' })))

    await user.type(screen.getByLabelText('Номер телефона'), '79991234567{Enter}')

    expect(await screen.findByRole('alert')).toHaveTextContent('не найден в MAX')
    expect(onChatFound).not.toHaveBeenCalled()
  })

  it('disables the search until the number is complete', async () => {
    const { user } = setup()
    const button = screen.getByRole('button', { name: 'Найти в MAX' })

    await user.type(screen.getByLabelText('Номер телефона'), '+7999')
    expect(button).toBeDisabled()
    await user.type(screen.getByLabelText('Номер телефона'), '1234567')
    expect(button).toBeEnabled()
  })

  it('closes on Escape', async () => {
    const { user, onClose } = setup()
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })
})
