import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { StudioTheme } from '@/components/symbol-bundle/studio-theme'
import './globals.css'

const body = localFont({
  src: [
    { path: '../public/fonts/asap-sharp-400.ttf', weight: '400' },
    { path: '../public/fonts/asap-sharp-500.ttf', weight: '500' },
    { path: '../public/fonts/asap-sharp-600.ttf', weight: '600' },
    { path: '../public/fonts/asap-sharp-700.ttf', weight: '700' },
  ],
  variable: '--font-asap-sharp',
  display: 'swap',
})

const heading = localFont({
  src: [
    { path: '../public/fonts/libre-caslon-condensed-400.ttf', weight: '400' },
    { path: '../public/fonts/libre-caslon-condensed-500.ttf', weight: '500' },
    { path: '../public/fonts/libre-caslon-condensed-600.ttf', weight: '600' },
    { path: '../public/fonts/libre-caslon-condensed-700.ttf', weight: '700' },
  ],
  variable: '--font-libre-caslon-condensed',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SymbolBundle — Your logo ready to be shipped',
  description: 'Ready to go structure for your logo: ship it immediately',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0908' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`bg-background ${body.variable} ${heading.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=document.cookie.split('; ').find(function(c){return c.startsWith('symbolbundle-theme=')});var v=t&&t.split('=')[1];var d=v==='dark'||(v!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light'})()` }} />
      </head>
      <body className="font-sans antialiased">
        <StudioTheme>{children}</StudioTheme>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
