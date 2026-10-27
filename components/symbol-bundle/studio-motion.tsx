'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

export function StudioMotion({ children, ready }: { children: ReactNode; ready: boolean }) {
  const root = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    function updateMotion() { setEnabled(!reducedMotion.matches) }
    updateMotion()
    reducedMotion.addEventListener('change', updateMotion)
    return () => reducedMotion.removeEventListener('change', updateMotion)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.studioMotion = enabled ? 'full' : 'reduced'
    return () => { delete document.documentElement.dataset.studioMotion }
  }, [enabled])

  useEffect(() => {
    if (!enabled || !root.current?.querySelector('[data-studio-intro]')) return
    let disposed = false
    let cleanup: (() => void) | undefined
    void import('gsap').then(({ gsap }) => {
      if (disposed || !root.current) return
      const context = gsap.context(() => {
        gsap.fromTo('[data-studio-intro]', { opacity: 0.8, y: 6 }, { opacity: 1, y: 0, duration: 0.28, ease: 'power3.out', clearProps: 'transform,opacity' })
      }, root.current)
      cleanup = () => context.revert()
    }).catch(() => {})
    return () => { disposed = true; cleanup?.() }
  }, [enabled])

  return <div ref={root} className="studio-root min-h-screen" data-ready={ready} data-motion={enabled ? 'full' : 'reduced'}>
    {children}
  </div>
}
