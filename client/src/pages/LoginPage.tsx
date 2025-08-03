import { useState } from 'react'
import {
  Container,
  Paper,
  Title,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Text,
  Divider,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useSignInMutation, useSignUpMutation } from '../services/api'

interface LoginFormValues {
  email: string
  password: string
  name?: string
  confirmPassword?: string
}

export const LoginPage = () => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [signIn, { isLoading: isSigningIn }] = useSignInMutation()
  const [signUp, { isLoading: isSigningUp }] = useSignUpMutation()

  const form = useForm<LoginFormValues>({
    initialValues: {
      email: '',
      password: '',
      name: '',
      confirmPassword: '',
    },
    validate: {
      email: (value?: string) => (!value || !/^\S+@\S+$/.test(value) ? 'Invalid email' : null),
      password: (value?: string) => (!value || value.length < 6 ? 'Password must be at least 6 characters' : null),
      name: (value?: string) => (isSignUp && !value ? 'Name is required' : null),
      confirmPassword: (value?: string, values?: LoginFormValues) =>
        isSignUp && value !== values?.password ? 'Passwords do not match' : null,
    },
  })

  const handleSubmit = async (values: LoginFormValues) => {
    try {
      if (isSignUp) {
        const result = await signUp({
          user: {
            email: values.email,
            password: values.password,
            password_confirmation: values.confirmPassword!,
            name: values.name!,
          },
        }).unwrap()
        
        notifications.show({
          title: 'Success',
          message: result.status.message,
          color: 'green',
        })
        
        // Page will automatically update due to authentication state change
      } else {
        const result = await signIn({
          user: {
            email: values.email,
            password: values.password,
          },
        }).unwrap()
        
        notifications.show({
          title: 'Success',
          message: result.status.message,
          color: 'green',
        })
        
        // Page will automatically update due to authentication state change
      }
    } catch (error: unknown) {
      const errorMessage = 
        (error as { data?: { error?: string; status?: { message?: string } } })?.data?.error ||
        (error as { data?: { error?: string; status?: { message?: string } } })?.data?.status?.message ||
        'An error occurred'
      
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
      })
    }
  }

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
    <Container size="xs" py="xl">
      <Paper shadow="md" p="xl" radius="md">
        <Title order={2} ta="center" mb="md">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </Title>
        
        <form onSubmit={form.onSubmit((values) => handleSubmit(values as LoginFormValues))}>
          <Stack>
            {isSignUp && (
              <TextInput
                label="Name"
                placeholder="Your full name"
                {...form.getInputProps('name')}
              />
            )}
            
            <TextInput
              label="Email"
              placeholder="your@email.com"
              {...form.getInputProps('email')}
            />
            
            <PasswordInput
              label="Password"
              placeholder="Your password"
              {...form.getInputProps('password')}
            />
            
            {isSignUp && (
              <PasswordInput
                label="Confirm Password"
                placeholder="Confirm your password"
                {...form.getInputProps('confirmPassword')}
              />
            )}
            
            <Button
              type="submit"
              loading={isSigningIn || isSigningUp}
              fullWidth
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </Stack>
        </form>

        <Divider label="or" labelPosition="center" my="lg" />

        <Button
          variant="outline"
          fullWidth
          onClick={handleGoogleAuth}
        >
          Continue with Google
        </Button>

        <Text ta="center" mt="md">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <Button
            variant="subtle"
            p={0}
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </Button>
        </Text>
      </Paper>
    </Container>
  )
}