import { getChatTitle } from '../lib/chat'
import { formatChatDate } from '../lib/format'
import type { Chat } from '../state/types'
import { Avatar } from './Avatar'
import { CheckIcon, LogoutIcon, PlusIcon } from './icons'

interface ChatListProps {
  chats: Chat[]
  activeChatId: string | null
  onSelect: (chatId: string) => void
  onNewChat: () => void
  onLogout: () => void
}

export function ChatList({ chats, activeChatId, onSelect, onNewChat, onLogout }: ChatListProps) {
  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <h1 className="sidebar__title">Чаты</h1>
        <button
          type="button"
          className="icon-button"
          onClick={onLogout}
          aria-label="Выйти"
          title="Выйти"
        >
          <LogoutIcon />
        </button>
        <button
          type="button"
          className="round-button"
          onClick={onNewChat}
          aria-label="Новый чат"
          title="Новый чат"
        >
          <PlusIcon />
        </button>
      </header>

      <ul className="chat-list" aria-label="Список чатов">
        {chats.map((chat) => {
          const title = getChatTitle(chat)
          const last = chat.messages.at(-1)
          return (
            <li key={chat.chatId}>
              <button
                type="button"
                className={`chat-item${chat.chatId === activeChatId ? ' chat-item--active' : ''}`}
                onClick={() => onSelect(chat.chatId)}
                aria-current={chat.chatId === activeChatId ? 'true' : undefined}
              >
                <Avatar chatId={chat.chatId} title={title} />
                <span className="chat-item__body">
                  <span className="chat-item__top">
                    <span className="chat-item__title">{title}</span>
                    <span className="chat-item__date">
                      {last?.direction === 'out' && last.status === 'sent' && (
                        <CheckIcon className="chat-item__check" />
                      )}
                      {formatChatDate(last?.timestamp ?? chat.updatedAt)}
                    </span>
                  </span>
                  <span className="chat-item__preview">{last?.text ?? 'Нет сообщений'}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {chats.length === 0 && (
        <p className="sidebar__empty">
          Чатов пока нет. Нажмите «+», чтобы найти собеседника по номеру телефона.
        </p>
      )}
    </aside>
  )
}
