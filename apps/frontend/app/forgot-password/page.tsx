'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, CheckCircle, Mail } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { Field } from '@/components/auth/field'
import { Button } from '@/components/ui/button'
import { authApi } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await authApi.forgotPassword(email)
      setIsSubmitted(true)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Sıfırlama e-postası gönderilemedi. Lütfen tekrar deneyin.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell eyebrow="Şifre kurtarma">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Şifrenizi Sıfırlayın</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          E-posta adresinizi girin, size bir sıfırlama bağlantısı gönderelim.
        </p>
      </div>

      {isSubmitted ? (
        <div className="mt-8 space-y-6">
          <div className="flex items-center gap-3 rounded-xl border border-emerald/30 bg-emerald/10 px-4 py-3">
            <CheckCircle className="size-5 text-emerald" />
            <p className="text-sm text-emerald">
              Sıfırlama bağlantısı gönderildi! Gelen kutunuzu kontrol edin.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            E-postayı almadınız mı?{' '}
            <button
              onClick={() => {
                setIsSubmitted(false)
                setEmail('')
              }}
              className="font-medium text-primary hover:underline"
            >
              Tekrar dene
            </button>
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Giriş sayfasına dön
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

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

          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
          </Button>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Giriş sayfasına dön
          </Link>
        </form>
      )}
    </AuthShell>
  )
}
