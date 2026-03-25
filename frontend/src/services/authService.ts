import { api } from './api'
import type { AuthResponse, LoginCredentials, RegisterCredentials, User } from '@/types'

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post<{ data: AuthResponse }>('/auth/login', credentials)
    return data.data
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const { data } = await api.post<{ data: AuthResponse }>('/auth/register', credentials)
    return data.data
  },

  async getCurrentUser(): Promise<User> {
    const { data } = await api.get<{ data: User }>('/auth/me')
    return data.data
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },

  async refreshToken(refreshToken: string): Promise<{ token: string }> {
    const { data } = await api.post<{ data: { token: string } }>('/auth/refresh', { refreshToken })
    return data.data
  },
}
