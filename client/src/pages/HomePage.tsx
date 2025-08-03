import { Container, Title, Text, Button, Center } from '@mantine/core'
import { useAuth } from '../hooks/useAuth'

export const HomePage = () => {
  const { user, logout } = useAuth()

  return (
    <Container size="sm" py="xl">
      <Title order={1} ta="center" mb="lg">
        Welcome to the App
      </Title>
      
      <Text ta="center" mb="md">
        Hello, {user?.name || user?.email}!
      </Text>
      
      <Text ta="center" mb="xl" c="dimmed">
        You have successfully authenticated. This is your protected dashboard.
      </Text>
      
      <Center>
        <Button onClick={logout} color="red">
          Sign Out
        </Button>
      </Center>
    </Container>
  )
}