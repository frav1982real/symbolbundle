import type { ReactNode } from 'react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './studio-theme'

export function SiteHeader({ page, children }: { page: 'home' | 'generate'; children?: ReactNode }) {
  return <header className="border-b border-border bg-card text-card-foreground">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
      <Link href="/" aria-label="SymbolBundle home" className="flex items-center gap-2.5">
        <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/SymbolBundle-rT9Bmy4jn4DEiq9WgNF7mxGIbUYhFD.png" alt="" width={32} height={32} className="size-8 shrink-0 rounded-lg" />
        <span className="text-base font-semibold tracking-tight sm:text-lg">SymbolBundle</span>
      </Link>
      <nav aria-label="Main navigation" className="flex items-center gap-2 sm:gap-3">
        <Link href="/" aria-current={page === 'home' ? 'page' : undefined} className={cn('text-sm hover:text-foreground', page === 'home' ? 'font-medium text-foreground' : 'text-muted-foreground')}>
          <span className="sm:hidden">Home</span><span className="hidden sm:inline">How it works</span>
        </Link>
        <ThemeToggle />
        {page === 'home' && <Link href="/generate" data-slot="button" className={buttonVariants({ size: 'sm' })}>Generate</Link>}
        {children}
      </nav>
    </div>
  </header>
}

export function SiteFooter() {
  return <footer className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-6 text-sm text-muted-foreground sm:px-8">
    <Link href="/" className="hover:text-foreground">SymbolBundle</Link>
    <span>Made for designers.</span>
  </footer>
}
