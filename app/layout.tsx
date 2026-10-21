import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SymbolBundle — Your logo ready to be shipped',
  description: 'Ready to go structure for your logo: ship it immediately',
  icons: {
    icon: { url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/SymbolBundle-rT9Bmy4jn4DEiq9WgNF7mxGIbUYhFD.png', type: 'image/png' },
    apple: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/SymbolBundle-rT9Bmy4jn4DEiq9WgNF7mxGIbUYhFD.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f4f5f7',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`bg-background ${mono.variable}`}>
      <body className="font-mono antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
