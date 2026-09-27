import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { createGreenApiClient } from '../api/greenApi'
import type { Credentials } from '../api/types'
import { useNotificationPolling, type PollingOptions } from '../hooks/useNotificationPolling'
import { loadChats, saveChats } from '../lib/storage'
import { chatsReducer, initialChatsState, selectChatList } from '../state/chatsReducer'
import { ChatList } from './ChatList'
import { ChatWindow } from './ChatWindow'
import { EmptyState } from './EmptyState'
import { NewChatModal } from './NewChatModal'

interface MessengerProps {
  credentials: Credentials
  onLogout: () => void
  pollingOptions?: PollingOptions
}

let localIdCounter = 0

export function Messenger({ credentials, onLogout, pollingOptions }: MessengerProps) {
  const client = useMemo(() => createGreenApiClient(credentials), [credentials])
  const [state, dispatch] = useReducer(chatsReducer, undefined, () => loadChats() ?? initialChatsState)
  const [newChatOpen, setNewChatOpen] = useState(false)

  useEffect(() => saveChats(state), [state])

  useNotificationPolling(
    client,
    ({ message, chatName }) => dispatch({ type: 'messageAdded', message, chatName }),
    pollingOptions,
  )

  const activeChat = state.activeChatId ? state.chats[state.activeChatId] : undefined
  const chats = selectChatList(state)

  async function sendMessage(chatId: string, text: string) {
    const localId = `local-${Date.now()}-${++localIdCounter}`
    dispatch({
      type: 'messageAdded',
      message: { id: localId, chatId, text, timestamp: Date.now(), direction: 'out', status: 'sending' },
    })
    try {
      const { idMessage } = await client.sendMessage(chatId, text)
      dispatch({ type: 'messageSent', chatId, localId, idMessage })
    } catch {
      dispatch({ type: 'messageFailed', chatId, localId })
    }
  }

  const closeNewChat = useCallback(() => setNewChatOpen(false), [])

  return (
    <div className={`messenger${activeChat ? ' messenger--chat-open' : ''}`}>
      <ChatList
        chats={chats}
        activeChatId={state.activeChatId}
        onSelect={(chatId) => dispatch({ type: 'chatSelected', chatId })}
        onNewChat={() => setNewChatOpen(true)}
        onLogout={onLogout}
      />

      {activeChat ? (
        <ChatWindow
          chat={activeChat}
          onSend={(text) => void sendMessage(activeChat.chatId, text)}
          onBack={() => dispatch({ type: 'chatSelected', chatId: null })}
        />
      ) : (
        <EmptyState />
      )}

      {newChatOpen && (
        <NewChatModal
          checkAccount={(phone) => client.checkAccount(phone)}
          onClose={closeNewChat}
          onChatFound={(chatId, phone) => {
            dispatch({ type: 'chatOpened', chatId, phone })
            setNewChatOpen(false)
          }}
        />
      )}
    </div>
  )
}
