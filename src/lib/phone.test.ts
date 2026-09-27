import { describe, expect, it } from 'vitest'
import { formatPhone, normalizePhone } from './phone'

describe('normalizePhone', () => {
  it('converts a number in international format to an integer', () => {
    expect(normalizePhone('+7 (999) 123-45-67')).toBe(79991234567)
    expect(normalizePhone('375 29 123 45 67')).toBe(375291234567)
  })

  it('accepts a Russian number starting with 8', () => {
    expect(normalizePhone('8 999 123 45 67')).toBe(79991234567)
  })

  it('returns null for incomplete or too long numbers', () => {
    expect(normalizePhone('+7 999 123')).toBeNull()
    expect(normalizePhone('')).toBeNull()
    expect(normalizePhone('+7 999 123 45 67 890')).toBeNull()
  })
})

describe('formatPhone', () => {
  it('formats Russian and Belarusian numbers', () => {
    expect(formatPhone('79991234567')).toBe('+7 999 123-45-67')
    expect(formatPhone('375291234567')).toBe('+375 29 123-45-67')
  })

  it('falls back to plus and digits', () => {
    expect(formatPhone('123')).toBe('+123')
  })
})
