import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Avasafe AI — Apply for your OCI card without the headache',
  description:
    'AI-powered OCI card application. Self-serve. No human ever sees your documents.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-white text-slate-900`}>
        {children}
      </body>
    </html>
  )
}
