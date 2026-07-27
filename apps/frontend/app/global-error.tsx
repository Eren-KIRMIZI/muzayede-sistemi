'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="tr" className="dark">
      <body className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <AlertTriangle className="mx-auto size-16 text-destructive" />
          <h1 className="mt-6 text-3xl font-bold">Bir hata oluştu</h1>
          <p className="mt-3 max-w-md text-muted-foreground">
            {error.message || 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.'}
          </p>
          {error.digest && (
            <p className="mt-2 font-mono text-xs text-muted-foreground/60">
              Hata ID: {error.digest}
            </p>
          )}
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button onClick={reset} variant="outline">
              Tekrar dene
            </Button>
            <Link href="/">
              <Button>Ana sayfaya dön</Button>
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
