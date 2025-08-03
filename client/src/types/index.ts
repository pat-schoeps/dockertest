export interface User {
  id: number
  email: string
  name: string
  avatar_url?: string
  provider?: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface ApiError {
  error: string
}

export interface ApiResponse<T> {
  data: T
}

export interface AuthResponse {
  status: {
    code: number
    message: string
  }
  data: User
}