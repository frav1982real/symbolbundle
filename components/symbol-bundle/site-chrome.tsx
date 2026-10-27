import type { MouseEventHandler, ReactNode } from 'react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './studio-theme'

export function SiteHeader({ page, children, onNavigateHome }: { page: 'home' | 'generate'; children?: ReactNode; onNavigateHome?: MouseEventHandler<HTMLAnchorElement> }) {
  return <header className="border-b border-border bg-card text-card-foreground">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
      <Link href="/" onClick={onNavigateHome} aria-label="SymbolBundle home" className="flex items-center gap-2.5">
        <img src="/images/symbolbundle.png" alt="" width={32} height={32} className="size-8 shrink-0 rounded-lg" />
        <span className="text-base font-semibold tracking-tight sm:text-lg">SymbolBundle</span>
      </Link>
      <nav aria-label="Main navigation" className="flex items-center gap-2 sm:gap-3">
        <Link href={page === 'home' ? '#howitworks' : '/'} onClick={onNavigateHome} className={cn('flex min-h-10 items-center text-sm hover:text-foreground', page === 'home' ? 'hidden font-medium text-foreground sm:flex' : 'text-muted-foreground')}>
          {page === 'home' ? 'How it works' : 'Home'}
        </Link>
        <ThemeToggle />
        {page === 'home' && <Link href="/generate" data-slot="button" className={buttonVariants({ size: 'sm' })}>Generate</Link>}
        {children}
      </nav>
    </div>
  </header>
}

export function SiteFooter({ onNavigateHome }: { onNavigateHome?: MouseEventHandler<HTMLAnchorElement> } = {}) {
  return <footer className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-6 text-sm text-muted-foreground sm:px-8">
    <Link href="/" onClick={onNavigateHome} className="hover:text-foreground">SymbolBundle</Link>
    <span>Made for designers.</span>
  </footer>
}
