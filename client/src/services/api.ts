import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'

// Types for our API responses
export interface User {
  id: number
  email: string
  name: string
  avatar_url?: string
  provider?: string
}

export interface AuthResponse {
  status: {
    code: number
    message: string
  }
  data: User
}

export interface SignUpRequest {
  user: {
    email: string
    password: string
    password_confirmation: string
    name: string
  }
}

export interface SignInRequest {
  user: {
    email: string
    password: string
  }
}

export interface GoogleAuthRequest {
  code: string
}

// Base query with authentication
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    return headers
  },
})

// Base query with automatic token handling
const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions)
  
  // Handle authentication errors
  if (result.error && result.error.status === 401) {
    // Clear invalid token
    localStorage.removeItem('authToken')
    // Optionally redirect to login
    window.location.href = '/login'
  }
  
  return result
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['User'],
  endpoints: (builder) => ({
    // Auth endpoints
    signUp: builder.mutation<AuthResponse, SignUpRequest>({
      query: (credentials) => ({
        url: '/auth/sign_up',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (response: AuthResponse, meta: { response?: Response }) => {
        // Extract JWT token from Authorization header
        const authHeader = meta?.response?.headers.get('authorization')
        if (authHeader) {
          const token = authHeader.replace('Bearer ', '')
          localStorage.setItem('authToken', token)
        }
        return response
      },
    }),
    
    signIn: builder.mutation<AuthResponse, SignInRequest>({
      query: (credentials) => ({
        url: '/auth/sign_in',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (response: AuthResponse, meta: { response?: Response }) => {
        // Extract JWT token from Authorization header
        const authHeader = meta?.response?.headers.get('authorization')
        if (authHeader) {
          const token = authHeader.replace('Bearer ', '')
          localStorage.setItem('authToken', token)
        }
        return response
      },
    }),
    
    signOut: builder.mutation<{ status: number; message: string }, void>({
      query: () => ({
        url: '/auth/sign_out',
        method: 'DELETE',
      }),
      transformResponse: (response: { status: number; message: string }) => {
        localStorage.removeItem('authToken')
        return response
      },
    }),
    
    googleAuth: builder.mutation<{ status: { code: number; message: string }; data: { user: User; token: string } }, GoogleAuthRequest>({
      query: (authData) => ({
        url: '/auth/google',
        method: 'POST',
        body: authData,
      }),
      transformResponse: (response: { status: { code: number; message: string }; data: { user: User; token: string } }) => {
        // Store JWT token from response body (Google OAuth returns it differently)
        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token)
        }
        return response
      },
    }),
    
    // Protected endpoints
    getCurrentUser: builder.query<{ data: User }, void>({
      query: () => '/api/v1/users/me',
      providesTags: ['User'],
    }),
  }),
})

export const {
  useSignUpMutation,
  useSignInMutation,
  useSignOutMutation,
  useGoogleAuthMutation,
  useGetCurrentUserQuery,
} = apiSlice