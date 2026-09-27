/**
 * Converts a phone number typed in international format ("+7 999 123-45-67")
 * into the integer checkAccount expects (79991234567). A Russian number
 * starting with 8 is accepted too. Returns null while the number is incomplete.
 */
export function normalizePhone(input: string): number | null {
  let digits = input.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`
  if (digits.length < 11 || digits.length > 12) return null
  return Number(digits)
}

/** "79991234567" -> "+7 999 123-45-67", "375291234567" -> "+375 29 123-45-67". */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  let match = /^7(\d{3})(\d{3})(\d{2})(\d{2})$/.exec(digits)
  if (match) return `+7 ${match[1]} ${match[2]}-${match[3]}-${match[4]}`
  match = /^375(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(digits)
  if (match) return `+375 ${match[1]} ${match[2]}-${match[3]}-${match[4]}`
  return `+${digits}`
}
