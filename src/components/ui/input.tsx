import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-md border border-border-strong bg-bg-inset px-3 text-sm text-text',
        'placeholder:text-text-faint',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
        className,
      )}
      {...props}
    />
  )
}
