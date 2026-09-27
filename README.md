# MAX Chat on GREEN-API

A minimal web chat for sending and receiving **text messages in MAX** through [GREEN-API](https://green-api.com/max).

Built with React 19, TypeScript and Vite. Tests use Vitest and React Testing Library.

## Requirements

- Node.js 20.19+ or 22.12+ (required by Vite 8)
- A GREEN-API instance for MAX, authorized in the [GREEN-API console](https://console.green-api.com)

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:5173.

### Other commands

| Command | Description |
| --- | --- |
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm run preview` | Serve the production build locally |

## Usage

### Configure the instance

In the [GREEN-API console](https://console.green-api.com), open your MAX instance. Make sure it is authorized.
Then check its settings; without them messages can be sent but replies never arrive:

- **`webhookUrl` is empty.** Otherwise notifications go to that URL instead of the HTTP API queue this app reads.
- **Incoming message notifications (`incomingWebhook`) are enabled.**
- Optionally, enable notifications for messages sent from the phone (`outgoingMessageWebhook`), so they also appear in the chat.

Save the settings. Only one client should read the instance's notification queue at a time.

### Chat

1. Copy **idInstance**, **apiTokenInstance** and **apiUrl** from the instance page.
2. Enter them on the login screen. `apiUrl` is filled in from the first four digits of idInstance
   (for example `https://3100.api.green-api.com`). If the console shows a different value, replace it.
   The app checks the instance state with `getStateInstance` before logging in.
3. Press **+** next to "Чаты", enter the recipient's phone number in international format
   (for example `+7 999 123 45 67`) and press **Найти в MAX**.
4. Type a message and press **Enter** (**Shift+Enter** inserts a new line).
5. Reply from the MAX app on the recipient's phone. The reply appears in the chat within a few seconds.

Messages from contacts that aren't in the list yet create a new chat automatically.
Use the logout button next to **+** to sign out. Signing out clears the saved credentials and chats.

## How it works

| Step | GREEN-API method |
| --- | --- |
| Validate credentials | [`getStateInstance`](https://green-api.com/v3/docs/api/account/GetStateInstance/) |
| Find a MAX user by phone | [`checkAccount`](https://green-api.com/v3/docs/api/service/CheckAccount/): returns the user's `chatId` |
| Send a text message | [`sendMessage`](https://green-api.com/v3/docs/api/sending/SendMessage/) |
| Receive messages | [HTTP API](https://green-api.com/v3/docs/api/receiving/technology-http-api/): `receiveNotification` + `deleteNotification` |

- **Chat IDs.** In MAX, a chat is addressed by a numeric `chatId`, not by a phone number.
  The app calls `checkAccount` once when creating a chat and sends every message to the returned `chatId`.
  This way the recipient's replies (which carry the same `chatId`) land in the same chat.
- **Receiving.** While you are logged in, the app long-polls `receiveNotification` (`receiveTimeout=20`).
  Text messages (`textMessage`, `extendedTextMessage`) from `incomingMessageReceived` and
  `outgoingMessageReceived` / `outgoingAPIMessageReceived` notifications are added to the matching chat.
  Every notification is then removed with `deleteNotification`, including ones the app ignores, so the queue doesn't get stuck.
  If a request fails, the app logs a warning to the browser console and retries every 3 seconds.
- **Sending.** A message appears right away with a clock icon. After `sendMessage` returns an `idMessage`, the icon becomes a check mark,
  or a red mark if sending failed. The `outgoingAPIMessageReceived` echo of the same message is dropped as a duplicate by `idMessage`.
- **Storage.** Credentials and chat history are kept in `sessionStorage`: they survive a page reload
  but are cleared when the tab is closed or you log out. apiTokenInstance never leaves the browser except in requests to the GREEN-API host you entered.
  Anything stored in the browser can be read by scripts running on the page, so in production the token would live on a backend that proxies GREEN-API.

## Project structure

```
src/
  api/          GREEN-API client (fetch wrapper) and response types
  components/   LoginScreen, Messenger, ChatList, ChatWindow, MessageList, MessageInput, NewChatModal
  hooks/        useNotificationPolling – receive/delete notification loop
  lib/          notification parsing, phone formatting, dates, sessionStorage
  state/        chats reducer (chats, messages, active chat)
  test/         test setup and an in-memory fake of the GREEN-API endpoints
```

## Tests

`npm test` runs:

- unit tests for the API client (URLs, request bodies, errors), notification parsing, phone number handling and the chats reducer;
- tests for the polling hook: notifications are received, handled and deleted; errors are retried; polling stops on unmount;
- component tests for the login screen, the new chat dialog and the chat window;
- an integration test of the full scenario against a fake GREEN-API:
  log in → create a chat by phone → send a message → receive the recipient's reply.
