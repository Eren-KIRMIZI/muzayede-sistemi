'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/stores'
import { authApi } from '@/lib/api'
import { loadTokens, clearTokens } from '@/lib/api-client'

export function AuthInit({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore()

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

  return <>{children}</>
}
