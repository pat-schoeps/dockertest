import {
  Container,
  Paper,
  Title,
  Button,
  Stack,
  Text,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconBrandGoogle } from '@tabler/icons-react'

export const LoginPage = () => {

  const handleGoogleAuth = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    const redirectUri = encodeURIComponent('http://localhost:3001/auth/google/callback')
    const scope = encodeURIComponent('email profile')
    
    if (!clientId) {
      notifications.show({
        title: 'Configuration Error',
        message: 'Google Client ID not configured. Please check your .env file.',
        color: 'red',
      })
      return
    }
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `scope=${scope}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent`
    
    window.location.href = googleAuthUrl
  }

  return (
    <Container size={420} my={40}>
      <Title
        ta="center"
        style={{ fontWeight: 500 }}
      >
        Welcome back!
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Sign in to your account to continue
      </Text>

      <Paper withBorder shadow="sm" p={22} mt={30} radius="md">
        <Stack>
          <Text ta="center" size="sm" c="dimmed" mb="xs">
            Continue with your Google account
          </Text>
          
          <Button
            leftSection={<IconBrandGoogle size={20} />}
            variant="outline"
            radius="xl"
            fullWidth
            size="md"
            onClick={handleGoogleAuth}
          >
            Sign in with Google
          </Button>
        </Stack>
      </Paper>
    </Container>
  )
}