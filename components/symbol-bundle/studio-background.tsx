'use client'

import { useEffect, useRef } from 'react'

const brandImage = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/SymbolBundle-rT9Bmy4jn4DEiq9WgNF7mxGIbUYhFD.png'

export function StudioBackground({ enabled, paused }: { enabled: boolean; paused: boolean }) {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled || paused || !root.current) return
    let disposed = false
    let cleanup: (() => void) | undefined

    void import('gsap').then(({ gsap }) => {
      if (disposed || !root.current) return
      const element = root.current
      const context = gsap.context(() => {
        gsap.to('[data-studio-grid]', { x: 48, y: 48, duration: 28, ease: 'none', repeat: -1 })
        gsap.to('[data-studio-sheet="first"]', { y: -22, rotation: 3, duration: 10, ease: 'sine.inOut', repeat: -1, yoyo: true })
        gsap.to('[data-studio-sheet="second"]', { y: 26, rotation: -4, duration: 13, ease: 'sine.inOut', repeat: -1, yoyo: true })
        gsap.fromTo('[data-studio-scan]', { yPercent: -100 }, { yPercent: 650, duration: 16, stagger: 5, ease: 'sine.inOut', repeat: -1, yoyo: true })
      }, element)

      const parallax = element.querySelector('[data-studio-parallax]')
      const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
      const moveX = gsap.quickTo(parallax, 'x', { duration: 1.2, ease: 'power2.out' })
      const moveY = gsap.quickTo(parallax, 'y', { duration: 1.2, ease: 'power2.out' })
      function onPointerMove(event: PointerEvent) {
        if (!finePointer.matches || event.pointerType === 'touch') return
        moveX((event.clientX / window.innerWidth - 0.5) * 18)
        moveY((event.clientY / window.innerHeight - 0.5) * 14)
      }
      function resetPointer() { moveX(0); moveY(0) }

      window.addEventListener('pointermove', onPointerMove, { passive: true })
      document.documentElement.addEventListener('pointerleave', resetPointer)
      cleanup = () => {
        window.removeEventListener('pointermove', onPointerMove)
        document.documentElement.removeEventListener('pointerleave', resetPointer)
        moveX.tween.kill()
        moveY.tween.kill()
        gsap.set(parallax, { clearProps: 'transform' })
        context.revert()
      }
    }).catch(() => {})

    return () => { disposed = true; cleanup?.() }
  }, [enabled, paused])

  return <div ref={root} className="studio-backdrop" aria-hidden="true">
    <div className="studio-grid" data-studio-grid />
    <div className="studio-parallax" data-studio-parallax>
      <div className="studio-sheet studio-sheet-first" data-studio-sheet="first"><img src={brandImage} width={160} height={160} alt="" draggable={false} /><span>SYMBOL / STUDIO</span></div>
      <div className="studio-sheet studio-sheet-second" data-studio-sheet="second"><img src={brandImage} width={120} height={120} alt="" draggable={false} /><span>DESIGNED TO MOVE</span></div>
    </div>
    <div className="studio-rail studio-rail-first"><span data-studio-scan /></div>
    <div className="studio-rail studio-rail-second"><span data-studio-scan /></div>
  </div>
}
