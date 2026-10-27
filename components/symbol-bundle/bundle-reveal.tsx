'use client'

import { useEffect, useId, useRef, useState, type PointerEvent } from 'react'
import { ArrowDownToLine, ArrowUpRight, Check, FolderArchive, PackageOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function BundleReveal() {
  const [unpacked, setUnpacked] = useState(true)
  const [instant, setInstant] = useState(false)
  const deck = useRef<HTMLDivElement>(null)
  const frame = useRef<number>(0)
  const sceneId = useId()

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  function tilt(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse' || !window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width - 0.5
    const y = (event.clientY - bounds.top) / bounds.height - 0.5
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      if (deck.current) deck.current.style.transform = `rotateX(${-y * 8}deg) rotateY(${x * 10}deg)`
    })
  }

  function resetTilt() {
    cancelAnimationFrame(frame.current)
    if (deck.current) deck.current.style.transform = ''
  }

  return <figure className="bundle-reveal" data-unpacked={unpacked} data-instant={instant}>
    <div className="bundle-kicker"><span className="bundle-kicker-line" />The art of the handoff</div>
    <div id={sceneId} className="bundle-scene" role="img" aria-label={unpacked ? 'A logo unfolds into vector files, transparent images, a brand guide, and a color palette.' : 'All your brand assets packed into one organized ZIP.'} onPointerMove={tilt} onPointerLeave={resetTilt}>
      <div ref={deck} className="bundle-deck" aria-hidden="true">
        <div className="bundle-card bundle-raster">
          <div className="bundle-file-label"><span>Digital exports</span><span>PNG</span></div>
          <div className="bundle-raster-art"><span className="font-serif">symbol.</span><ArrowUpRight className="size-5" /></div>
          <span className="bundle-file-note">Transparent. Every size.</span>
        </div>
        <div className="bundle-card bundle-guide">
          <div className="bundle-file-label"><span>The essentials</span><span>PDF</span></div>
          <span className="bundle-guide-title font-serif">A little guide.<br />A lasting<br />impression.</span>
          <div className="bundle-guide-rule" />
          <div className="bundle-guide-footer"><img src="/images/symbolbundle.png" alt="" width={40} height={40} draggable={false} /><span>Made to be<br />consistent.</span></div>
        </div>
        <div className="bundle-card bundle-logo">
          <div className="bundle-file-label"><span>Your starting point</span><span>SVG</span></div>
          <div className="bundle-logo-art"><img src="/images/symbolbundle.png" alt="" width={96} height={96} draggable={false} /><span className="font-serif">symbol.</span></div>
          <div className="bundle-file-label"><span>primary-logo.svg</span><ArrowUpRight className="size-4 shrink-0" /></div>
        </div>
        <div className="bundle-card bundle-palette">
          <div className="bundle-swatches"><span /><span /><span /><span /></div>
          <div className="bundle-file-label"><span>Your true colors</span><span>HEX / RGB / CMYK</span></div>
        </div>
        <div className="bundle-seal"><FolderArchive className="size-4" /><span>brand-bundle.zip</span><Check className="size-4" /></div>
      </div>
    </div>
    <figcaption className="bundle-caption">
      <span className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowDownToLine className="size-4 shrink-0" aria-hidden="true" />Everything. In one ZIP.</span>
      <Button type="button" variant="outline" aria-expanded={unpacked} aria-controls={sceneId} onClick={event => { resetTilt(); setInstant(event.detail === 0); setUnpacked(current => !current) }}>
        {unpacked ? <FolderArchive data-icon="inline-start" aria-hidden="true" /> : <PackageOpen data-icon="inline-start" aria-hidden="true" />}
        {unpacked ? 'Pack it up' : 'Unpack it'}
      </Button>
    </figcaption>
    <span className="sr-only" role="status">{unpacked ? 'Bundle unpacked: vector files, digital exports, brand guide, and color palette.' : 'Bundle packed into brand-bundle.zip.'}</span>
  </figure>
}
