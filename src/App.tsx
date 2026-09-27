import { useState } from 'react'
import type { Credentials } from './api/types'
import { LoginScreen } from './components/LoginScreen'
import { Messenger } from './components/Messenger'
import type { PollingOptions } from './hooks/useNotificationPolling'
import { loadCredentials, saveChats, saveCredentials } from './lib/storage'

interface AppProps {
  pollingOptions?: PollingOptions
}

function App({ pollingOptions }: AppProps) {
  const [credentials, setCredentials] = useState<Credentials | null>(loadCredentials)

  if (!credentials) {
    return (
      <LoginScreen
        onLogin={(value) => {
          saveCredentials(value)
          setCredentials(value)
        }}
      />
    )
  }

  return (
    <Messenger
      key={credentials.idInstance}
      credentials={credentials}
      pollingOptions={pollingOptions}
      onLogout={() => {
        saveCredentials(null)
        saveChats(null)
        setCredentials(null)
      }}
    />
  )
}

export default App
