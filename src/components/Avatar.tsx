import { getAvatarGradient, getInitials } from '../lib/chat'
import { UserIcon } from './icons'

interface AvatarProps {
  chatId: string
  title: string
  size?: 'md' | 'lg'
}

export function Avatar({ chatId, title, size = 'lg' }: AvatarProps) {
  const initials = getInitials(title)
  return (
    <div
      className={`avatar avatar--${size}`}
      style={{ background: getAvatarGradient(chatId) }}
      aria-hidden="true"
    >
      {initials || <UserIcon />}
    </div>
  )
}
