import { apiClient } from '../api-client'
import type { ApiResponse, User } from '../types'

interface LoginPayload {
  email: string
  password: string
}

interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  password: string
}

interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/login', payload).then((r) => r.data.data),

  register: (payload: RegisterPayload) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/register', payload).then((r) => r.data.data),

  refresh: (refreshToken: string) =>
    apiClient
      .post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh', { refreshToken })
      .then((r) => r.data.data),

  logout: (refreshToken?: string) =>
    apiClient.post<ApiResponse<{ message: string }>>('/auth/logout', { refreshToken }).then((r) => r.data.data),

  forgotPassword: (email: string) =>
    apiClient.post<ApiResponse<{ message: string }>>('/auth/forgot-password', { email }).then((r) => r.data.data),

  resetPassword: (token: string, password: string) =>
    apiClient
      .post<ApiResponse<{ message: string }>>('/auth/reset-password', { token, password })
      .then((r) => r.data.data),

  me: () => apiClient.get<ApiResponse<User>>('/auth/me').then((r) => r.data.data),

  updateProfile: (data: Partial<User>) =>
    apiClient.patch<ApiResponse<User>>('/users/me', data).then((r) => r.data.data),
}
