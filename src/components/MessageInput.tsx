import { useState, type SubmitEvent, type KeyboardEvent } from 'react'
import { SendIcon } from './icons'

// GREEN-API sendMessage limit.
const MAX_LENGTH = 4000

interface MessageInputProps {
  onSend: (text: string) => void
}

export function MessageInput({ onSend }: MessageInputProps) {
  const [text, setText] = useState('')
  const canSend = text.trim().length > 0

  function send() {
    if (!canSend) return
    onSend(text.trim())
    setText('')
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    send()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      send()
    }
  }

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <textarea
        className="composer__input"
        rows={1}
        placeholder="Сообщение"
        aria-label="Сообщение"
        maxLength={MAX_LENGTH}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      <button
        type="submit"
        className="round-button composer__send"
        disabled={!canSend}
        aria-label="Отправить"
        title="Отправить"
      >
        <SendIcon />
      </button>
    </form>
  )
}
