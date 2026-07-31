import { RouterProvider } from 'react-router-dom'
import { HardwareProvider } from '@/features/hardware-detection/context/hardware-context'
import { router } from './router'

function App() {
  return (
    <HardwareProvider>
      <RouterProvider router={router} />
    </HardwareProvider>
  )
}

export default App
