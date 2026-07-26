'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { DashboardShell } from '@/components/dashboard/shell'
import { Button } from '@/components/ui/button'
import { auctionsApi } from '@/lib/api/auctions'
import type { AuctionCategory } from '@/lib/types'

export default function CreateAuctionPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [startingPrice, setStartingPrice] = useState('')
  const [reservePrice, setReservePrice] = useState('')
  const [bidIncrement, setBidIncrement] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [location, setLocation] = useState('')
  const [shipping, setShipping] = useState('')
  const [imageUrls, setImageUrls] = useState([''])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => auctionsApi.getCategories(),
    staleTime: 5 * 60_000,
  })

  const categories: AuctionCategory[] = categoriesData?.data || []

  const createMutation = useMutation({
    mutationFn: () =>
      auctionsApi.create({
        title,
        description,
        categoryId,
        startingPrice: Number(startingPrice),
        reservePrice: reservePrice ? Number(reservePrice) : undefined,
        bidIncrement: Number(bidIncrement),
        endsAt: new Date(endsAt).toISOString(),
        location: location || undefined,
        shipping: shipping || undefined,
        imageUrls: imageUrls.filter((u) => u.trim()),
      }),
    onSuccess: (res) => {
      router.push(`/auctions/${res.data.id}`)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to create auction'
      setErrors({ submit: Array.isArray(msg) ? msg.join(', ') : msg })
    },
  })

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Title is required'
    if (title.length > 200) e.title = 'Max 200 characters'
    if (!description.trim()) e.description = 'Description is required'
    if (!categoryId) e.categoryId = 'Category is required'
    if (!startingPrice || Number(startingPrice) <= 0) e.startingPrice = 'Must be greater than 0'
    if (!bidIncrement || Number(bidIncrement) <= 0) e.bidIncrement = 'Must be greater than 0'
    if (!endsAt) e.endsAt = 'End time is required'
    if (endsAt && new Date(endsAt) <= new Date()) e.endsAt = 'Must be in the future'
    if (reservePrice && Number(reservePrice) < Number(startingPrice))
      e.reservePrice = 'Must be >= starting price'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) createMutation.mutate()
  }

  function addImageUrl() {
    setImageUrls([...imageUrls, ''])
  }

  function removeImageUrl(index: number) {
    setImageUrls(imageUrls.filter((_, i) => i !== index))
  }

  function updateImageUrl(index: number, value: string) {
    const next = [...imageUrls]
    next[index] = value
    setImageUrls(next)
  }

  function fieldError(key: string) {
    return errors[key] ? (
      <p className="mt-1 text-xs text-destructive">{errors[key]}</p>
    ) : null
  }

  const inputClass =
    'w-full rounded-xl border border-border bg-input/40 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary placeholder:text-muted-foreground'
  const labelClass = 'block text-sm font-medium text-foreground mb-1'

  return (
    <DashboardShell title="Create Auction" subtitle="List a new item for auction">
      <Link
        href="/dashboard/auctions"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to My Auctions
      </Link>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
        {errors.submit && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            {errors.submit}
          </div>
        )}

        {/* Title & Description */}
        <section className="glass rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">Basic Information</h2>
          <div>
            <label className={labelClass}>Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Vintage Rolex Submariner 1968"
              maxLength={200}
              className={inputClass}
            />
            {fieldError('title')}
            <p className="mt-1 text-xs text-muted-foreground">{title.length}/200</p>
          </div>
          <div>
            <label className={labelClass}>Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your item in detail..."
              rows={5}
              className={inputClass + ' resize-none'}
            />
            {fieldError('description')}
          </div>
        </section>

        {/* Category */}
        <section className="glass rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">Category</h2>
          <div>
            <label className={labelClass}>Category *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputClass}
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {fieldError('categoryId')}
          </div>
        </section>

        {/* Pricing */}
        <section className="glass rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">Pricing</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Starting Price ($) *</label>
              <input
                type="number"
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                className={inputClass}
              />
              {fieldError('startingPrice')}
            </div>
            <div>
              <label className={labelClass}>Reserve Price ($)</label>
              <input
                type="number"
                value={reservePrice}
                onChange={(e) => setReservePrice(e.target.value)}
                placeholder="Optional minimum sale price"
                min="0"
                step="0.01"
                className={inputClass}
              />
              {fieldError('reservePrice')}
            </div>
          </div>
          <div>
            <label className={labelClass}>Bid Increment ($) *</label>
            <input
              type="number"
              value={bidIncrement}
              onChange={(e) => setBidIncrement(e.target.value)}
              placeholder="1.00"
              min="0.01"
              step="0.01"
              className={inputClass}
            />
            {fieldError('bidIncrement')}
          </div>
        </section>

        {/* Duration */}
        <section className="glass rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">Duration</h2>
          <div>
            <label className={labelClass}>Ends At *</label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className={inputClass}
            />
            {fieldError('endsAt')}
          </div>
        </section>

        {/* Location & Shipping */}
        <section className="glass rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">Location & Shipping</h2>
          <div>
            <label className={labelClass}>Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. New York, NY"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Shipping Info</label>
            <input
              value={shipping}
              onChange={(e) => setShipping(e.target.value)}
              placeholder="e.g. Free shipping within US"
              className={inputClass}
            />
          </div>
        </section>

        {/* Images */}
        <section className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Images</h2>
            <Button type="button" variant="ghost" size="sm" onClick={addImageUrl}>
              <Plus className="mr-1 size-3" /> Add URL
            </Button>
          </div>
          {imageUrls.map((url, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={url}
                onChange={(e) => updateImageUrl(i, e.target.value)}
                placeholder="https://example.com/image.jpg"
                className={inputClass}
              />
              {imageUrls.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeImageUrl(i)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Enter image URLs. The first image will be the primary display image.
          </p>
        </section>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            size="lg"
            disabled={createMutation.isPending}
            className="h-12 px-8"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Auction (Draft)'}
          </Button>
          <Link href="/dashboard/auctions">
            <Button type="button" variant="ghost" size="lg">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </DashboardShell>
  )
}
