'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../stores'
import { authApi } from '../api'
import { loadTokens, clearTokens } from '../api-client'

export function useAuthInit() {
  const { setUser, setLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    const { accessToken } = loadTokens()

    if (!accessToken) {
      setLoading(false)
      return
    }

    authApi
      .me()
      .then((user) => setUser(user))
      .catch(() => {
        clearTokens()
        setUser(null)
      })
  }, [setUser, setLoading])

  const logout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    } finally {
      clearTokens()
      useAuthStore.getState().logout()
      router.push('/login')
    }
  }

  return { logout }
}
