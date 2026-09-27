import { useEffect, useId, useState, type SubmitEvent } from 'react'
import { normalizePhone } from '../lib/phone'
import type { CheckAccountResponse } from '../api/types'
import { CloseIcon } from './icons'

interface NewChatModalProps {
  checkAccount: (phoneNumber: number) => Promise<CheckAccountResponse>
  onChatFound: (chatId: string, phone: string) => void
  onClose: () => void
}

export function NewChatModal({ checkAccount, onChatFound, onClose }: NewChatModalProps) {
  const titleId = useId()
  const [phoneInput, setPhoneInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const phoneNumber = normalizePhone(phoneInput)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (phoneNumber === null || loading) return
    setLoading(true)
    setError(null)
    try {
      const { exist, chatId } = await checkAccount(phoneNumber)
      if (exist && chatId) {
        onChatFound(chatId, String(phoneNumber))
        return
      }
      setError('Пользователь с таким номером не найден в MAX')
    } catch {
      setError('Не удалось проверить номер. Попробуйте ещё раз')
    }
    setLoading(false)
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={handleSubmit}
      >
        <div className="modal__header">
          <h2 id={titleId} className="modal__title">
            Найти по номеру
          </h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Закрыть">
            <CloseIcon />
          </button>
        </div>

        <input
          className="phone-input"
          type="tel"
          inputMode="tel"
          autoFocus
          aria-label="Номер телефона"
          placeholder="+7 999 123 45 67"
          value={phoneInput}
          onChange={(e) => {
            setPhoneInput(e.target.value)
            setError(null)
          }}
        />

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button
          className="button button--primary"
          type="submit"
          disabled={phoneNumber === null || loading}
        >
          {loading ? 'Ищем…' : 'Найти в MAX'}
        </button>
      </form>
    </div>
  )
}
