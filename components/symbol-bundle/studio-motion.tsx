'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

const MotionContext = createContext({ enabled: false })

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
    if (!enabled || !root.current) return
    let disposed = false
    let cleanup: (() => void) | undefined
    void import('gsap').then(({ gsap }) => {
      if (disposed || !root.current) return
      const context = gsap.context(() => {
        gsap.fromTo('[data-studio-intro]', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.65, stagger: 0.09, ease: 'power3.out', clearProps: 'transform,opacity' })
      }, root.current)
      cleanup = () => context.revert()
    }).catch(() => {})
    return () => { disposed = true; cleanup?.() }
  }, [enabled])

  return <MotionContext.Provider value={{ enabled }}>
    <div ref={root} className="studio-root min-h-screen" data-ready={ready} data-motion={enabled ? 'full' : 'reduced'}>
      {children}
    </div>
  </MotionContext.Provider>
}

export function useStudioTransition<T extends HTMLElement>(transitionKey: string, selector = '[data-motion-item]') {
  const { enabled } = useContext(MotionContext)
  const root = useRef<T>(null)

  useEffect(() => {
    if (!enabled || !root.current) return
    let disposed = false
    let cleanup: (() => void) | undefined
    void import('gsap').then(({ gsap }) => {
      if (disposed || !root.current) return
      const context = gsap.context(() => {
        const targets = Array.from(root.current!.querySelectorAll<HTMLElement>(selector)).filter(target => !target.closest('[hidden]'))
        if (targets.length) gsap.fromTo(targets, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.42, stagger: 0.055, ease: 'power2.out', clearProps: 'transform,opacity' })
      }, root.current)
      cleanup = () => context.revert()
    }).catch(() => {})
    return () => { disposed = true; cleanup?.() }
  }, [enabled, transitionKey, selector])

  return root
}
