import type { Metadata } from 'next'
import './globals.css'
import AuthStateListener from '@/components/AuthStateListener'
import Toast from '@/components/Toast'
import PostHogProvider from '@/providers/PostHogProvider'
import FeedbackWidget from '@/components/FeedbackWidget'

export const metadata: Metadata = {
  title: 'Avasafe AI | Your OCI card. Your passport renewal. Done.',
  description:
    'AVA securely stores your documents and automatically prepares every application so you never have to navigate a government portal again.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthStateListener />
        <Toast />
        <PostHogProvider>
          {children}
          <FeedbackWidget triggerLocation="global" autoTriggerMs={120000} />
        </PostHogProvider>
      </body>
    </html>
  )
}
