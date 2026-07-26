import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <FileQuestion className="mx-auto size-16 text-muted-foreground" />
        <h1 className="mt-6 text-3xl font-bold">Page not found</h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/">
            <Button>Go home</Button>
          </Link>
          <Link href="/auctions">
            <Button variant="outline">Browse auctions</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
