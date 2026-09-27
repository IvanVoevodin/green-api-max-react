import { describe, expect, it } from 'vitest'
import { getChatTitle, getInitials } from './chat'

describe('getChatTitle', () => {
  it('prefers the name, then the formatted phone, then the chat id', () => {
    expect(getChatTitle({ chatId: '1', name: 'Иван', phone: '79991234567' })).toBe('Иван')
    expect(getChatTitle({ chatId: '1', phone: '79991234567' })).toBe('+7 999 123-45-67')
    expect(getChatTitle({ chatId: '1' })).toBe('Чат 1')
  })
})

describe('getInitials', () => {
  it('uses the first letters of the first and last words', () => {
    expect(getInitials('Green API Test')).toBe('GT')
    expect(getInitials('екатерина')).toBe('Е')
  })

  it('returns an empty string for titles without letters', () => {
    expect(getInitials('+7 999 123-45-67')).toBe('')
  })
})
