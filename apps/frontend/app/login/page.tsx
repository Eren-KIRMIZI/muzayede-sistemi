'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Lock, Mail } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { Field } from '@/components/auth/field'
import { Button } from '@/components/ui/button'
import { authApi } from '@/lib/api'
import { setTokens } from '@/lib/api-client'
import { useAuthStore } from '@/lib/stores'

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const data = await authApi.login({ email, password })
      setTokens(data.accessToken, data.refreshToken)
      login(data.user)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Geçersiz e-posta veya şifre')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell eyebrow="Tekrar hoş geldiniz">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AuctionHub'a Giriş Yap</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Teklif panelinize erişmek için bilgilerinizi girin.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setEmail('admin@auctionhub.com'); setPassword('Admin@123456') }}
            className="flex-1 rounded-xl border border-border bg-white/5 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => { setEmail('seller@auctionhub.com'); setPassword('Seller@123456') }}
            className="flex-1 rounded-xl border border-border bg-white/5 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            Seller
          </button>
          <button
            type="button"
            onClick={() => { setEmail('user@auctionhub.com'); setPassword('User@123456') }}
            className="flex-1 rounded-xl border border-border bg-white/5 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            User
          </button>
        </div>

        <Field
          label="Email"
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Field
          label="Password"
          id="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input
              type="checkbox"
              className="size-4 rounded border-input bg-background/40 accent-primary"
            />
            Beni hatırla
          </label>
          <Link href="/forgot-password" className="text-primary hover:underline">
            Şifremi unuttum?
          </Link>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={isLoading}
          className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Hesabınız yok mu?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Hesap oluşturun
        </Link>
      </p>
    </AuthShell>
  )
}
