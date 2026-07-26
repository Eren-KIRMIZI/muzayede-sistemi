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
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell eyebrow="Password recovery">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {isSubmitted ? (
        <div className="mt-8 space-y-6">
          <div className="flex items-center gap-3 rounded-xl border border-emerald/30 bg-emerald/10 px-4 py-3">
            <CheckCircle className="size-5 text-emerald" />
            <p className="text-sm text-emerald">
              Reset link sent! Check your inbox.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Didn&apos;t receive the email?{' '}
            <button
              onClick={() => {
                setIsSubmitted(false)
                setEmail('')
              }}
              className="font-medium text-primary hover:underline"
            >
              Try again
            </button>
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to sign in
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
            placeholder="you@company.com"
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
            {isLoading ? 'Sending...' : 'Send reset link'}
          </Button>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to sign in
          </Link>
        </form>
      )}
    </AuthShell>
  )
}
