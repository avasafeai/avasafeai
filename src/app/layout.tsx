import type { Metadata } from 'next'
import './globals.css'
import AuthStateListener from '@/components/AuthStateListener'

export const metadata: Metadata = {
  title: 'Avasafe AI — Your OCI card. Your passport renewal. Done.',
  description:
    'AVA securely stores your documents and automatically prepares every application — so you never have to navigate a government portal again.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthStateListener />
        {children}
      </body>
    </html>
  )
}
