import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export function UserAvatar({
  name,
  src,
  className,
}: {
  name: string
  src?: string
  className?: string
}) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  return (
    <Avatar className={cn('size-11', className)}>
      {src ? <AvatarImage src={src} alt={name} /> : null}
      <AvatarFallback className="bg-primary/10 text-primary">
        {initial}
      </AvatarFallback>
    </Avatar>
  )
}
