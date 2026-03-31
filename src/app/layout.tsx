import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Avasafe AI — Your OCI card. Your passport renewal. Done.',
  description:
    'AVA securely stores your documents and automatically prepares every application — so you never have to navigate a government portal again.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
