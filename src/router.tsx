import { createBrowserRouter } from 'react-router-dom'
import { MainLayout } from '@/layouts/main-layout'
import { HomePage } from '@/pages/home-page'
import { GameDetailPage } from '@/pages/game-detail-page'
import { NotFoundPage } from '@/pages/not-found-page'

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/juego/:id', element: <GameDetailPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
