import { getChatTitle } from '../lib/chat'
import { formatPhone } from '../lib/phone'
import type { Chat } from '../state/types'
import { Avatar } from './Avatar'
import { BackIcon } from './icons'
import { MessageInput } from './MessageInput'
import { MessageList } from './MessageList'

interface ChatWindowProps {
  chat: Chat
  onSend: (text: string) => void
  onBack: () => void
}

export function ChatWindow({ chat, onSend, onBack }: ChatWindowProps) {
  const title = getChatTitle(chat)
  const subtitle = chat.name && chat.phone ? formatPhone(chat.phone) : 'MAX'

  return (
    <section className="chat" aria-label={`Чат: ${title}`}>
      <header className="chat__header">
        <button type="button" className="icon-button" onClick={onBack} aria-label="Закрыть чат">
          <BackIcon />
        </button>
        <Avatar chatId={chat.chatId} title={title} size="md" />
        <div className="chat__heading">
          <h2 className="chat__title">{title}</h2>
          <p className="chat__subtitle">{subtitle}</p>
        </div>
      </header>

      <MessageList messages={chat.messages} />
      {/* key resets the draft when switching chats */}
      <MessageInput key={chat.chatId} onSend={onSend} />
    </section>
  )
}
