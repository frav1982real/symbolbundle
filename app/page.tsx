import type { Metadata } from 'next'
import { HelpSection } from '@/components/symbol-bundle/help-section'
import { SiteFooter, SiteHeader } from '@/components/symbol-bundle/site-chrome'
import { StudioMotion } from '@/components/symbol-bundle/studio-motion'

export const metadata: Metadata = {
  title: 'SymbolBundle — How it works',
  description: 'Turn your existing SVG logos into an organized delivery bundle. Learn how to choose roles, colors, and formats, then download your ZIP for free.',
}

export default function Home() {
  return <StudioMotion ready>
    <a href="#come-funziona" className="sr-only rounded bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50">Skip to how it works</a>
    <SiteHeader page="home" />
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-16">
      <HelpSection />
    </main>
    <SiteFooter />
  </StudioMotion>
}
