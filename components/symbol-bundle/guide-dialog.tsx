'use client'

import { useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { ArrowDownToLine, ArrowUpRight, BookOpen, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type BundleProject, languageOptions, slugify } from '@/lib/bundle/model'
import { getGuideContent } from '@/lib/bundle/guide-content'
import { saveBlob } from '@/lib/bundle/raster'
import { PdfPreview } from './pdf-preview'

type GuideResult = { blob: Blob; url: string; pdf: PDFDocumentProxy; project: BundleProject }

export function GuideDialog({ project, open, onOpenChange }: { project: BundleProject; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<GuideResult | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const generation = useRef(0)
  const locked = useRef(false)
  const t = getGuideContent(project.guideLanguage)
  const current = result?.project === project ? result : null
  const pages = t.titles.map((title, index) => ({ value: String(index + 1), label: `${String(index + 1).padStart(2, '0')} · ${title}` }))

  useEffect(() => { generation.current++; setResult(null); setPageNumber(1) }, [project])
  useEffect(() => () => { if (result) { URL.revokeObjectURL(result.url); void result.pdf.destroy() } }, [result])

  async function generate() {
    if (locked.current) return
    locked.current = true
    setBusy(true)
    const version = generation.current
    try {
      const [{ createGuide }, pdfjs] = await Promise.all([import('@/lib/bundle/guide'), import('pdfjs-dist')])
      const blob = await createGuide(project)
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise
      if (version !== generation.current) { void pdf.destroy(); return }
      setResult({ blob, pdf, url: URL.createObjectURL(blob), project })
      setPageNumber(1)
      toast.success('Guide ready. Browse all 17 pages before delivery.')
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to generate the guide.') }
    finally { setBusy(false); locked.current = false }
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-4xl">
      <DialogHeader><DialogTitle>Guide for {project.name || 'this brand'}</DialogTitle><DialogDescription>17 pages · 16:9 format · {languageOptions.find(language => language.value === project.guideLanguage)?.label}</DialogDescription></DialogHeader>
      {current ? <div className="flex flex-col gap-3">
        <PdfPreview pdf={current.pdf} pageNumber={pageNumber} title={t.titles[pageNumber - 1]} />
        <div className="flex min-w-0 items-center gap-2"><Button variant="outline" size="icon-sm" disabled={pageNumber === 1} onClick={() => setPageNumber(page => page - 1)} aria-label="Previous page"><ChevronLeft /></Button><Select items={pages} value={String(pageNumber)} onValueChange={value => setPageNumber(Number(value) || 1)}><SelectTrigger aria-label="Guide page" className="min-w-0 flex-1"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{pages.map(page => <SelectItem key={page.value} value={page.value}>{page.label}</SelectItem>)}</SelectGroup></SelectContent></Select><Button variant="outline" size="icon-sm" disabled={pageNumber === current.pdf.numPages} onClick={() => setPageNumber(page => page + 1)} aria-label="Next page"><ChevronRight /></Button></div>
        <p aria-live="polite" className="text-sm text-muted-foreground">Page {pageNumber} of {current.pdf.numPages}: {t.titles[pageNumber - 1]}</p>
      </div> : <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-lg border border-border bg-muted text-foreground"><BookOpen className="size-7 text-muted-foreground" /><p className="text-base font-medium">Review before delivery.</p><p className="max-w-72 px-4 text-center text-sm leading-relaxed text-muted-foreground">Generate the actual PDF and browse every page. No mock previews.</p></div>}
      <p className="text-sm leading-relaxed text-muted-foreground">Files, colors, and variations match your project. Clear space and applications are automatic proposals requiring approval.</p>
      <div className="flex flex-wrap items-center justify-between gap-3">{current ? <><a href={current.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-muted-foreground underline underline-offset-4">Open PDF<ArrowUpRight className="size-4" /></a><Button onClick={() => saveBlob(current.blob, `${slugify(project.name)}_Logo_Guide.pdf`)}><ArrowDownToLine data-icon="inline-start" />Download PDF</Button></> : <Button onClick={generate} disabled={busy || !project.assets.length}>{busy ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <BookOpen data-icon="inline-start" />}{busy ? 'Generating guide…' : 'Generate and browse PDF'}</Button>}</div>
    </DialogContent>
  </Dialog>
}
