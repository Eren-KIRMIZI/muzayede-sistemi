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
      const msg = err?.response?.data?.message || 'Müzayede oluşturulamadı'
      setErrors({ submit: Array.isArray(msg) ? msg.join(', ') : msg })
    },
  })

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Başlık zorunludur'
    if (title.length > 200) e.title = 'En fazla 200 karakter'
    if (!description.trim()) e.description = 'Açıklama zorunludur'
    if (!categoryId) e.categoryId = 'Kategori zorunludur'
    if (!startingPrice || Number(startingPrice) <= 0) e.startingPrice = '0\'dan büyük olmalıdır'
    if (!bidIncrement || Number(bidIncrement) <= 0) e.bidIncrement = '0\'dan büyük olmalıdır'
    if (!endsAt) e.endsAt = 'Bitiş zamanı zorunludur'
    if (endsAt && new Date(endsAt) <= new Date()) e.endsAt = 'Gelecek bir tarih olmalıdır'
    if (reservePrice && Number(reservePrice) < Number(startingPrice))
      e.reservePrice = 'Başlangıç fiyatından büyük veya eşit olmalıdır'
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
    <DashboardShell title="Müzayede Oluştur" subtitle="Müzayedeye yeni bir ürün listeleyin">
      <Link
        href="/dashboard/auctions"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Müzayedelerime Dön
      </Link>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
        {errors.submit && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            {errors.submit}
          </div>
        )}

        {/* Başlık ve Açıklama */}
        <section className="glass rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">Temel Bilgiler</h2>
          <div>
            <label className={labelClass}>Başlık *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn. Vintage saat, sanat eseri, koleksiyon ayakkabı"
              maxLength={200}
              className={inputClass}
            />
            {fieldError('title')}
            <p className="mt-1 text-xs text-muted-foreground">{title.length}/200</p>
          </div>
          <div>
            <label className={labelClass}>Açıklama *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ürününüzü detaylı bir şekilde açıklayın..."
              rows={5}
              className={inputClass + ' resize-none'}
            />
            {fieldError('description')}
          </div>
        </section>

        {/* Kategori */}
        <section className="glass rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">Kategori</h2>
          <div>
            <label className={labelClass}>Kategori *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputClass}
            >
              <option value="">Kategori seçin</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {fieldError('categoryId')}
          </div>
        </section>

        {/* Fiyatlandırma */}
        <section className="glass rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">Fiyatlandırma</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Başlangıç Fiyatı ($) *</label>
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
              <label className={labelClass}>Rezerv Fiyatı ($)</label>
              <input
                type="number"
                value={reservePrice}
                onChange={(e) => setReservePrice(e.target.value)}
                placeholder="İsteğe bağlı minimum satış fiyatı"
                min="0"
                step="0.01"
                className={inputClass}
              />
              {fieldError('reservePrice')}
            </div>
          </div>
          <div>
            <label className={labelClass}>Teklif Artışı ($) *</label>
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

        {/* Süre */}
        <section className="glass rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">Süre</h2>
          <div>
            <label className={labelClass}>Bitiş Tarihi *</label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className={inputClass}
            />
            {fieldError('endsAt')}
          </div>
        </section>

        {/* Konum ve Kargo */}
        <section className="glass rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">Konum ve Kargo</h2>
          <div>
            <label className={labelClass}>Konum</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Örn. İstanbul, Türkiye"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Kargo Bilgisi</label>
            <input
              value={shipping}
              onChange={(e) => setShipping(e.target.value)}
              placeholder="Örn. Dünya genelinde ücretsiz kargo"
              className={inputClass}
            />
          </div>
        </section>

        {/* Görseller */}
        <section className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Görseller</h2>
            <Button type="button" variant="ghost" size="sm" onClick={addImageUrl}>
              <Plus className="mr-1 size-3" /> URL Ekle
            </Button>
          </div>
          {imageUrls.map((url, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={url}
                onChange={(e) => updateImageUrl(i, e.target.value)}
                placeholder="https://ornek.com/gorsel.jpg"
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
            Görsel URL'lerini girin. İlk görsel ana gösterim görseli olarak kullanılacaktır.
          </p>
        </section>

        {/* Gönder */}
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            size="lg"
            disabled={createMutation.isPending}
            className="h-12 px-8"
          >
            {createMutation.isPending ? 'Oluşturuluyor...' : 'Müzayede Oluştur (Taslak)'}
          </Button>
          <Link href="/dashboard/auctions">
            <Button type="button" variant="ghost" size="lg">
              İptal
            </Button>
          </Link>
        </div>
      </form>
    </DashboardShell>
  )
}
