import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createFakeGreenApi } from '../test/fakeGreenApi'
import { LoginScreen } from './LoginScreen'

afterEach(() => vi.unstubAllGlobals())

async function fillForm() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('idInstance'), '3100123456')
  await user.type(screen.getByLabelText('apiTokenInstance'), 'token')
  return user
}

describe('LoginScreen', () => {
  it('suggests apiUrl from idInstance', async () => {
    render(<LoginScreen onLogin={vi.fn()} />)
    await fillForm()
    expect(screen.getByLabelText('apiUrl')).toHaveValue('https://3100.api.green-api.com')
  })

  it('logs in when the instance is authorized', async () => {
    const api = createFakeGreenApi()
    vi.stubGlobal('fetch', api.fetchMock)
    const onLogin = vi.fn()
    render(<LoginScreen onLogin={onLogin} />)

    const user = await fillForm()
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    await vi.waitFor(() =>
      expect(onLogin).toHaveBeenCalledWith({
        apiUrl: 'https://3100.api.green-api.com',
        idInstance: '3100123456',
        apiTokenInstance: 'token',
      }),
    )
  })

  it('shows an error when the instance is not authorized', async () => {
    vi.stubGlobal('fetch', createFakeGreenApi({ stateInstance: 'notAuthorized' }).fetchMock)
    const onLogin = vi.fn()
    render(<LoginScreen onLogin={onLogin} />)

    const user = await fillForm()
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('notAuthorized')
    expect(onLogin).not.toHaveBeenCalled()
  })

  it('shows an error for wrong credentials', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 401 })))
    render(<LoginScreen onLogin={vi.fn()} />)

    const user = await fillForm()
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Неверный idInstance или apiTokenInstance')
  })

  it('keeps the submit button disabled until the form is filled', () => {
    render(<LoginScreen onLogin={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Войти' })).toBeDisabled()
  })
})
