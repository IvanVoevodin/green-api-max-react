export interface Credentials {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
}

export interface StateInstanceResponse {
  stateInstance: string
}

export interface CheckAccountResponse {
  exist: boolean
  chatId: string
}

export interface SendMessageResponse {
  idMessage: string
}

/** Subset of the webhook body fields the chat UI needs. */
export interface NotificationBody {
  typeWebhook: string
  timestamp?: number
  idMessage?: string
  senderData?: {
    chatId?: string
    chatName?: string
    sender?: string
    senderName?: string
    senderContactName?: string
    senderPhoneNumber?: number
  }
  messageData?: {
    typeMessage?: string
    textMessageData?: { textMessage?: string }
    extendedTextMessageData?: { text?: string }
  }
}

export interface ReceivedNotification {
  receiptId: number
  body: NotificationBody
}
