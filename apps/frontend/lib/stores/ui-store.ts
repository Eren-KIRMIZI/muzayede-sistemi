'use client'

import { create } from 'zustand'

interface UIState {
  isMobileMenuOpen: boolean
  isSearchOpen: boolean
  isNotificationsOpen: boolean
  theme: 'light' | 'dark' | 'system'
  commandOpen: boolean

  toggleMobileMenu: () => void
  closeMobileMenu: () => void
  toggleSearch: () => void
  closeSearch: () => void
  toggleNotifications: () => void
  closeNotifications: () => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleCommand: () => void
  closeCommand: () => void
}

export const useUIStore = create<UIState>((set) => ({
  isMobileMenuOpen: false,
  isSearchOpen: false,
  isNotificationsOpen: false,
  theme: 'dark',
  commandOpen: false,

  toggleMobileMenu: () => set((s) => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  toggleSearch: () => set((s) => ({ isSearchOpen: !s.isSearchOpen, isMobileMenuOpen: false })),
  closeSearch: () => set({ isSearchOpen: false }),
  toggleNotifications: () =>
    set((s) => ({ isNotificationsOpen: !s.isNotificationsOpen, isSearchOpen: false })),
  closeNotifications: () => set({ isNotificationsOpen: false }),
  setTheme: (theme) => set({ theme }),
  toggleCommand: () => set((s) => ({ commandOpen: !s.commandOpen })),
  closeCommand: () => set({ commandOpen: false }),
}))
