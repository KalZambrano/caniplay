import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/hooks/use-page-title'

export function NotFoundPage() {
  usePageTitle('Página no encontrada — CanIPlay')

  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <span className="font-mono text-sm text-text-faint">404</span>
      <p className="text-text-muted">Esta página no existe.</p>
      <Link to="/">
        <Button variant="secondary" icon={<ArrowLeft className="size-4" />}>
          Volver al inicio
        </Button>
      </Link>
    </div>
  )
}
