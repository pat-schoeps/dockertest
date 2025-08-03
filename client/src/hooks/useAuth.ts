import { useGetCurrentUserQuery } from '../services/api'

export const useAuth = () => {
  const token = localStorage.getItem('authToken')
  const { data: currentUser, isLoading, error } = useGetCurrentUserQuery(undefined, {
    skip: !token, // Skip the query if no token is present
  })

  const isAuthenticated = !!token && !!currentUser && !error
  
  const logout = () => {
    localStorage.removeItem('authToken')
    window.location.href = '/login'
  }

  return {
    user: currentUser?.data || null,
    isAuthenticated,
    isLoading,
    error,
    logout,
    hasToken: !!token,
  }
}