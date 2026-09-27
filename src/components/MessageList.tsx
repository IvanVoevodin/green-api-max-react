import { useEffect, useRef } from 'react'
import { formatTime } from '../lib/format'
import type { Message } from '../state/types'
import { AlertIcon, CheckIcon, ClockIcon } from './icons'

const STATUS = {
  sending: { label: 'Отправляется', Icon: ClockIcon },
  sent: { label: 'Отправлено', Icon: CheckIcon },
  failed: { label: 'Не отправлено', Icon: AlertIcon },
}

function MessageStatus({ message }: { message: Message }) {
  if (message.direction !== 'out') return null
  const status = message.status ?? 'sent'
  const { label, Icon } = STATUS[status]
  return (
    <span className={`bubble__status bubble__status--${status}`} role="img" aria-label={label} title={label}>
      <Icon />
    </span>
  )
}

export function MessageList({ messages }: { messages: Message[] }) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  return (
    <div className="messages" role="log" aria-live="polite" aria-label="Сообщения">
      {messages.length === 0 && <p className="messages__empty">Напишите первое сообщение</p>}
      {messages.map((message) => (
        <div
          key={message.id}
          className={`bubble bubble--${message.direction}${message.status === 'failed' ? ' bubble--failed' : ''}`}
        >
          <span className="bubble__text">{message.text}</span>
          <span className="bubble__meta">
            <time dateTime={new Date(message.timestamp).toISOString()}>
              {formatTime(message.timestamp)}
            </time>
            <MessageStatus message={message} />
          </span>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  )
}
