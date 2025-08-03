import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { GoogleCallbackPage } from './pages/GoogleCallbackPage'
import { ProtectedRoute } from './components/ProtectedRoute'

function App() {
  return (
    <MantineProvider>
      <Notifications />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  )
}

export default App
