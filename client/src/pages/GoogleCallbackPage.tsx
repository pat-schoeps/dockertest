import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Center, Loader, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useGoogleAuthMutation } from '../services/api'

export const GoogleCallbackPage = () => {
  const [googleAuth] = useGoogleAuthMutation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const error = urlParams.get('error')

      if (error) {
        notifications.show({
          title: 'Authentication Error',
          message: 'Google authentication was cancelled or failed.',
          color: 'red',
        })
        navigate('/login', { replace: true })
        return
      }

      if (!code) {
        notifications.show({
          title: 'Authentication Error',
          message: 'No authorization code received from Google.',
          color: 'red',
        })
        navigate('/login', { replace: true })
        return
      }

      try {
        const result = await googleAuth({ code }).unwrap()
        
        notifications.show({
          title: 'Success',
          message: result.status.message,
          color: 'green',
        })
        
        // Redirect to home page
        navigate('/', { replace: true })
      } catch (error: unknown) {
        const errorMessage = 
          (error as { data?: { error?: string; status?: { message?: string } } })?.data?.error ||
          (error as { data?: { error?: string; status?: { message?: string } } })?.data?.status?.message ||
          'Authentication failed'
        
        notifications.show({
          title: 'Authentication Error',
          message: errorMessage,
          color: 'red',
        })
        
        navigate('/login', { replace: true })
      }
    }

    handleCallback()
  }, [googleAuth, navigate])

  return (
    <Container size="xs" py="xl">
      <Center>
        <div style={{ textAlign: 'center' }}>
          <Loader size="lg" mb="md" />
          <Text>Processing Google authentication...</Text>
        </div>
      </Center>
    </Container>
  )
}