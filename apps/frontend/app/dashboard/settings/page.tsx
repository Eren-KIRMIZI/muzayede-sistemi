'use client'

import { Bell, Eye, Globe, Lock, Moon, Palette, Shield, User } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/shell'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  return (
    <DashboardShell title="Settings" subtitle="Manage your account preferences">
      <div className="space-y-6">
        {/* Profile */}
        <section className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <User className="size-5 text-primary" />
            <h3 className="font-semibold">Profile</h3>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Display name</label>
              <input
                type="text"
                defaultValue="Alex"
                className="h-10 w-full rounded-xl border border-input bg-background/40 px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Email</label>
              <input
                type="email"
                defaultValue="alex@example.com"
                className="h-10 w-full rounded-xl border border-input bg-background/40 px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/40"
              />
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-4">Save changes</Button>
        </section>

        {/* Security */}
        <section className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <Lock className="size-5 text-primary" />
            <h3 className="font-semibold">Security</h3>
          </div>
          <div className="mt-4 space-y-3">
            {[
              { label: 'Change password', desc: 'Update your password regularly' },
              { label: 'Two-factor authentication', desc: 'Add an extra layer of security' },
              { label: 'Active sessions', desc: 'Manage your logged-in devices' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl border border-border/60 p-4">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Button variant="outline" size="sm">Manage</Button>
              </div>
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <Bell className="size-5 text-primary" />
            <h3 className="font-semibold">Notifications</h3>
          </div>
          <div className="mt-4 space-y-3">
            {[
              { label: 'Email notifications', desc: 'Receive updates via email', defaultOn: true },
              { label: 'Push notifications', desc: 'Browser push alerts', defaultOn: true },
              { label: 'Bid alerts', desc: 'When you\'re outbid', defaultOn: true },
              { label: 'Auction ending reminders', desc: '1 hour before auctions end', defaultOn: false },
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
            <h3 className="font-semibold">Appearance</h3>
          </div>
          <div className="mt-4 flex gap-3">
            {['Dark', 'Light', 'System'].map((theme) => (
              <button
                key={theme}
                className={`rounded-xl border px-6 py-3 text-sm font-medium transition-colors ${
                  theme === 'Dark'
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
