import type { Metadata, Viewport } from 'next'
import { Fraunces, Geist, Geist_Mono } from 'next/font/google'
import AppShell from '@/components/shell/app-shell'
import { RepsProvider } from '@/components/reps-provider'
import WinstonAmbient from '@/components/winston-ambient'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })
// The display face: headlines that read like a training programme, not a dashboard.
const fraunces = Fraunces({ variable: '--font-fraunces', subsets: ['latin'], axes: ['opsz'] })

export const metadata: Metadata = {
  title: { default: 'Reps', template: '%s · Reps' },
  description: 'Build fluency through repetition.',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = { themeColor: '#0f1a2a' }

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <RepsProvider>
          <AppShell>{children}</AppShell>
          <WinstonAmbient />
        </RepsProvider>
      </body>
    </html>
  )
}
