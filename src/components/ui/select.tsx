import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * `<select>` nativo con la piel del resto de campos. Nativo a propósito: en
 * móvil abre el selector del sistema y el teclado ya funciona sin código.
 */
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Clases del envoltorio: es quien decide el ancho que ocupa el campo. */
  containerClassName?: string
}

export function Select({ className, containerClassName, children, ...props }: SelectProps) {
  return (
    <div className={cn('relative', containerClassName)}>
      <select
        className={cn(
          'h-10 w-full appearance-none rounded-md border border-border-strong bg-bg-inset pl-3 pr-8 text-sm text-text',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-text-faint"
      />
    </div>
  )
}
