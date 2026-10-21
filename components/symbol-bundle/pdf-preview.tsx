'use client'

import { useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'

export function PdfPreview({ pdf, pageNumber, title }: { pdf: PDFDocumentProxy; pageNumber: number; title: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    let cancelled = false
    let task: { cancel: () => void } | undefined
    setError(false)
    async function render() {
      const page = await pdf.getPage(pageNumber)
      if (cancelled || !canvasRef.current) return
      const canvas = canvasRef.current
      const viewport = page.getViewport({ scale: 1.25 })
      const scale = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(viewport.width * scale)
      canvas.height = Math.floor(viewport.height * scale)
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Canvas unavailable')
      const rendering = page.render({ canvas, canvasContext: context, viewport, transform: scale === 1 ? undefined : [scale, 0, 0, scale, 0, 0] })
      task = rendering
      await rendering.promise
      if (!cancelled) canvas.dataset.renderedPage = String(pageNumber)
    }
    render().catch(error => { if (!cancelled && error?.name !== 'RenderingCancelledException') setError(true) })
    return () => { cancelled = true; task?.cancel() }
  }, [pdf, pageNumber])
  return <div className="overflow-hidden rounded-lg border border-border bg-canvas text-canvas-foreground">{error ? <p className="p-6 text-sm">Preview unavailable. You can still open or download the PDF.</p> : <canvas ref={canvasRef} role="img" aria-label={`Page ${pageNumber}: ${title}`} className="aspect-video h-auto w-full" />}</div>
}
