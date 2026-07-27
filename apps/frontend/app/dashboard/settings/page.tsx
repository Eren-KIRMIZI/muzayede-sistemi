'use client'

import { Bell, Lock, Palette, User } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/shell'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/stores'

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)

  return (
    <DashboardShell title="Ayarlar" subtitle="Hesap tercihlerinizi yönetin">
      <div className="space-y-6">
        {/* Profile */}
        <section className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <User className="size-5 text-primary" />
            <h3 className="font-semibold">Profil</h3>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Görünen ad</label>
              <input
                type="text"
                defaultValue={user?.firstName ? `${user.firstName} ${user.lastName}` : ''}
                placeholder="Adınız"
                className="h-10 w-full rounded-xl border border-input bg-background/40 px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">E-posta</label>
              <input
                type="email"
                defaultValue={user?.email ?? ''}
                placeholder="ornek@sirket.com"
                className="h-10 w-full rounded-xl border border-input bg-background/40 px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/40"
              />
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-4">Değişiklikleri kaydet</Button>
        </section>

        {/* Security */}
        <section className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <Lock className="size-5 text-primary" />
            <h3 className="font-semibold">Güvenlik</h3>
          </div>
          <div className="mt-4 space-y-3">
            {[
              { label: 'Şifre değiştir', desc: 'Şifrenizi düzenli olarak güncelleyin' },
              { label: 'İki faktörlü doğrulama', desc: 'Ekstra bir güvenlik katmanı ekleyin' },
              { label: 'Aktif oturumlar', desc: 'Giriş yapmış cihazlarınızı yönetin' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl border border-border/60 p-4">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Button variant="outline" size="sm">Yönet</Button>
              </div>
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <Bell className="size-5 text-primary" />
            <h3 className="font-semibold">Bildirimler</h3>
          </div>
          <div className="mt-4 space-y-3">
            {[
              { label: 'E-posta bildirimleri', desc: 'E-posta ile güncellemeler alın', defaultOn: true },
              { label: 'Anlık bildirimler', desc: 'Tarayıcı anlık uyarıları', defaultOn: true },
              { label: 'Teklif uyarıları', desc: 'Geçildiğinizde bildirim alın', defaultOn: true },
              { label: 'Müzayede bitiş hatırlatmaları', desc: 'Müzayedeler bitmeden 1 saat önce', defaultOn: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl border border-border/60 p-4">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" defaultChecked={item.defaultOn} className="peer sr-only" />
                  <div className="h-6 w-11 rounded-full bg-muted peer-checked:bg-primary after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
            ))}
          </div>
        </section>

        {/* Appearance */}
        <section className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <Palette className="size-5 text-primary" />
            <h3 className="font-semibold">Görünüm</h3>
          </div>
          <div className="mt-4 flex gap-3">
            {['Karanlık', 'Açık', 'Sistem'].map((theme) => (
              <button
                key={theme}
                className={`rounded-xl border px-6 py-3 text-sm font-medium transition-colors ${
                  theme === 'Karanlık'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                {theme}
              </button>
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  )
}
