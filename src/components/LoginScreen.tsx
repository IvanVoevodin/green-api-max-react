import { useState, type SubmitEvent } from 'react'
import { createGreenApiClient, GreenApiError, guessApiUrl } from '../api/greenApi'
import type { Credentials } from '../api/types'
import { ChatBubbleIcon } from './icons'

interface LoginScreenProps {
  onLogin: (credentials: Credentials) => void
}

function describeError(error: unknown): string {
  if (error instanceof GreenApiError) {
    if (error.status === 401 || error.status === 403) {
      return 'Неверный idInstance или apiTokenInstance'
    }
    return `GREEN-API вернул ошибку ${error.status}`
  }
  return 'Не удалось подключиться к GREEN-API. Проверьте apiUrl и интернет-соединение'
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [customApiUrl, setCustomApiUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Follows idInstance until the user edits the field.
  const apiUrl = customApiUrl ?? guessApiUrl(idInstance)
  const canSubmit = Boolean(idInstance.trim() && apiTokenInstance.trim() && apiUrl.trim()) && !loading

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return
    const credentials: Credentials = {
      apiUrl: apiUrl.trim(),
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
    }
    setLoading(true)
    setError(null)
    try {
      const { stateInstance } = await createGreenApiClient(credentials).getStateInstance()
      if (stateInstance === 'authorized') {
        onLogin(credentials)
        return
      }
      setError(`Инстанс не авторизован (состояние: ${stateInstance}). Авторизуйте его в консоли GREEN-API`)
    } catch (e) {
      setError(describeError(e))
    }
    setLoading(false)
  }

  return (
    <main className="login">
      <form className="login__card" onSubmit={handleSubmit} noValidate>
        <div className="login__logo" aria-hidden="true">
          <ChatBubbleIcon />
        </div>
        <h1 className="login__title">Вход в MAX Chat</h1>
        <p className="login__subtitle">
          Введите данные инстанса из{' '}
          <a href="https://console.green-api.com" target="_blank" rel="noreferrer">
            консоли GREEN-API
          </a>
        </p>

        <label className="field">
          <span className="field__label">idInstance</span>
          <input
            className="input"
            inputMode="numeric"
            autoComplete="off"
            placeholder="3100123456"
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="field__label">apiTokenInstance</span>
          <input
            className="input"
            type="password"
            autoComplete="off"
            placeholder="Токен инстанса"
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="field__label">apiUrl</span>
          <input
            className="input"
            type="url"
            autoComplete="off"
            placeholder="https://3100.api.green-api.com"
            value={apiUrl}
            onChange={(e) => setCustomApiUrl(e.target.value)}
          />
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button className="button button--primary" type="submit" disabled={!canSubmit}>
          {loading ? 'Проверяем…' : 'Войти'}
        </button>
      </form>
    </main>
  )
}
