import { Outlet, ScrollRestoration } from 'react-router-dom'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { SkipLink } from '@/components/ui/skip-link'

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-bg bg-grid">
      <SkipLink href="#main-content" />
      <Header />
      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      {/* Restaura el scroll al volver atrás (y lo sube al entrar a una página nueva). */}
      <ScrollRestoration />
    </div>
  )
}
