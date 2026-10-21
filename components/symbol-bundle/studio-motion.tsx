'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Leaf, Waves } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getMotionPolicy, parseMotionPreference, type MotionCapabilities, type MotionPreference } from '@/lib/motion-policy'
import { StudioBackground } from './studio-background'

interface MotionContextValue {
  enabled: boolean
  initialized: boolean
  reason: 'system' | 'manual' | 'device' | 'full'
  toggle: () => void
}

interface ConnectionInfo extends EventTarget { saveData?: boolean }
type MotionNavigator = Navigator & { deviceMemory?: number; connection?: ConnectionInfo }

const MotionContext = createContext<MotionContextValue>({ enabled: false, initialized: false, reason: 'full', toggle: () => {} })
const preferenceCookie = 'symbolbundle-motion'

export function StudioMotion({ children, ready, suspended }: { children: ReactNode; ready: boolean; suspended: boolean }) {
  const root = useRef<HTMLDivElement>(null)
  const [preference, setPreference] = useState<MotionPreference>('auto')
  const [capabilities, setCapabilities] = useState<MotionCapabilities>({ reducedMotion: false })
  const [initialized, setInitialized] = useState(false)
  const [visible, setVisible] = useState(true)
  const policy = getMotionPolicy(preference, capabilities)
  const enabled = initialized && policy.enabled

  useEffect(() => {
    const navigatorInfo = navigator as MotionNavigator
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    function updateCapabilities() {
      setCapabilities({ reducedMotion: reducedMotion.matches, saveData: navigatorInfo.connection?.saveData, deviceMemory: navigatorInfo.deviceMemory, hardwareConcurrency: navigatorInfo.hardwareConcurrency })
    }
    function updateVisibility() { setVisible(!document.hidden) }
    const saved = document.cookie.split('; ').find(cookie => cookie.startsWith(`${preferenceCookie}=`))?.split('=')[1]
    setPreference(parseMotionPreference(saved))
    updateCapabilities()
    updateVisibility()
    setInitialized(true)
    reducedMotion.addEventListener('change', updateCapabilities)
    navigatorInfo.connection?.addEventListener('change', updateCapabilities)
    document.addEventListener('visibilitychange', updateVisibility)
    return () => {
      reducedMotion.removeEventListener('change', updateCapabilities)
      navigatorInfo.connection?.removeEventListener('change', updateCapabilities)
      document.removeEventListener('visibilitychange', updateVisibility)
    }
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

  function toggle() {
    const next = enabled ? 'off' : 'on'
    setPreference(next)
    document.cookie = `${preferenceCookie}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`
  }

  return <MotionContext.Provider value={{ enabled, initialized, reason: policy.reason, toggle }}>
    <div ref={root} className="studio-root min-h-screen" data-ready={ready} data-motion={enabled ? 'full' : 'reduced'}>
      <StudioBackground enabled={enabled} paused={!visible || suspended} />
      {children}
    </div>
  </MotionContext.Provider>
}

export function MotionToggle() {
  const { enabled, initialized, reason, toggle } = useContext(MotionContext)
  const description = reason === 'system' ? 'Lite mode: reduced motion is enabled in your system settings.' : reason === 'device' ? 'Automatic lite mode to save resources. Press to enable effects.' : enabled ? 'Disable background effects and UI animations. Your preference is remembered.' : 'Enable background effects and UI animations. Your preference is remembered.'
  const Icon = enabled ? Waves : Leaf
  return <Button variant="outline" size="sm" className="motion-toggle shrink-0" aria-label="Animations" aria-pressed={enabled} title={description} disabled={!initialized || reason === 'system'} onClick={toggle}>
    <Icon data-icon="inline-start" /><span className="hidden md:inline">{enabled ? 'Animations on' : 'Lite mode'}</span>
  </Button>
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
