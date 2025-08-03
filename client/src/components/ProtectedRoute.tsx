import { Navigate } from 'react-router-dom'
import { Center, Loader } from '@mantine/core'
import { useAuth } from '../hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, hasToken } = useAuth()

  // Show loading spinner while checking authentication
  if (isLoading && hasToken) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Render protected content
  return <>{children}</>
}