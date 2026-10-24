import { cn } from '@/lib/cn'

interface SkipLinkProps {
  href: string
}

export function SkipLink({ href }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50',
        'rounded-md bg-brand px-4 py-2 text-sm font-medium text-white',
        'focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-bg',
      )}
    >
      Saltar al contenido principal
    </a>
  )
}
