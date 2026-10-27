'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { FolderArchive, Plus, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Toaster } from '@/components/ui/sonner'
import { ConfigPanel } from './config-panel'
import { LogoPreview } from './logo-preview'
import { PackagePanel } from './package-panel'
import { HelpSection } from './help-section'
import { GuideDialog } from './guide-dialog'
import { StudioMotion } from './studio-motion'
import { ThemeToggle, useStudioTheme } from './studio-theme'
import { type BundleProject, type LogoAsset, createDemoProject, createEmptyProject, getFilePlan, getProjectValidation } from '@/lib/bundle/model'
import { readLogoFile } from '@/lib/bundle/assets'
import { extractAssetColors, mergePalette } from '@/lib/bundle/palette'
import { saveBlob } from '@/lib/bundle/raster'

export function BundleWorkspace() {
  const { theme } = useStudioTheme()
  const [project, setProject] = useState<BundleProject>(createEmptyProject)
  const [selectedId, setSelectedId] = useState('')
  const [tab, setTab] = useState('logo')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [ready, setReady] = useState(false)
  const [finished, setFinished] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [progress, setProgress] = useState({ completed: 0, total: 0, filename: '' })
  const uploadLock = useRef(false)
  const exportLock = useRef(false)
  const files = useMemo(() => getFilePlan(project), [project])
  const isDemo = project.assets.length > 0 && project.assets.every(asset => asset.demo)
  const validationError = getProjectValidation(project)

  useEffect(() => { setReady(true) }, [])

  function update(patch: Partial<BundleProject>) {
    setProject(current => ({ ...current, ...patch }))
    setFinished(false)
  }

  async function upload(incoming: File[]) {
    if (!incoming.length || busy || uploadLock.current) return
    const existing = isDemo ? [] : project.assets
    if (existing.length + incoming.length > 10) { toast.error('You can add up to 10 logos per project.'); return }
    uploadLock.current = true
    setUploading(true)
    const loaded: LogoAsset[] = []
    for (const file of incoming) {
      try { loaded.push(await readLogoFile(file)) } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to read the logo.') }
    }
    if (loaded.length) {
      const assets = [...existing, ...loaded]
      const detected: string[] = []
      for (const asset of loaded) {
        try { detected.push(...await extractAssetColors(asset)) } catch { toast.info(`Unable to extract colors from ${asset.name}. You can set it in the Colors step.`) }
      }
      const colors = mergePalette([...(!existing.length || isDemo ? [] : project.colors), ...detected])
      const icon = assets.find(asset => asset.role === 'app-icon') || assets.find(asset => asset.role === 'logomark') || assets.find(asset => asset.id === project.iconAssetId) || assets[0]
      update({ assets, iconAssetId: icon.id, ...(colors.length ? { colors } : {}), ...(isDemo || !project.name.trim() ? { name: loaded[0].name.replace(/\.[^.]+$/i, '').replace(/[_-]/g, ' ').slice(0, 60) } : {}) })
      setSelectedId(loaded[0].id)
      toast.success(`${loaded.length === 1 ? 'Logo uploaded' : `${loaded.length} logos uploaded`}. Your package is taking shape.`)
    }
    setUploading(false)
    uploadLock.current = false
  }

  async function detectPalette(photo?: File) {
    if (busy || uploadLock.current) return
    uploadLock.current = true
    setUploading(true)
    try {
      const assets = photo ? [await readLogoFile(photo)] : project.assets
      const detected = mergePalette((await Promise.all(assets.map(extractAssetColors))).flat())
      if (!detected.length) throw new Error('No visible colors detected. Try an image with more defined areas.')
      update({ colors: detected })
      toast.success(`${detected.length} colors detected${photo ? ' from the photo' : ' from the logos'}. Review the palette before confirming.`)
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to analyze colors.') }
    finally { setUploading(false); uploadLock.current = false }
  }

  function remove(id: string) {
    const assets = project.assets.filter(asset => asset.id !== id)
    update({ assets, iconAssetId: project.iconAssetId === id ? assets[0]?.id || '' : project.iconAssetId })
    if (selectedId === id) setSelectedId(assets[0]?.id || '')
  }

  function reset(demo: boolean) {
    setProject(demo ? createDemoProject() : createEmptyProject())
    setSelectedId(demo ? 'demo-primary' : '')
    setTab('logo')
    setFinished(false)
    setResetOpen(false)
    toast.success(demo ? 'Sample project loaded.' : 'A blank canvas, a new brand.')
  }

  async function download() {
    if (validationError || uploadLock.current || exportLock.current) return
    exportLock.current = true
    setBusy(true)
    setProgress({ completed: 0, total: files.length, filename: 'Preparing…' })
    try {
      const { generateBundle } = await import('@/lib/bundle/export')
      const result = await generateBundle(project, (completed, total, filename) => setProgress({ completed, total, filename }))
      saveBlob(result.blob, result.filename)
      setFinished(true)
      toast.success('Your brand is ready to go.', { description: `${result.count} files organized in a single ZIP.` })
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Export failed. Try again with fewer formats.') }
    finally { setBusy(false); exportLock.current = false }
  }

  function focusUpload() {
    setTab('logo')
    requestAnimationFrame(() => { document.getElementById('svg-upload')?.click() })
  }

  return <StudioMotion ready={ready}>
    <a href="#workspace" className="sr-only rounded bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50">Skip to generator</a>
    <header className="border-b border-border bg-card text-card-foreground">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <a href="#" aria-label="SymbolBundle, back to top" className="flex items-center gap-2.5"><img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/SymbolBundle-rT9Bmy4jn4DEiq9WgNF7mxGIbUYhFD.png" alt="" width={32} height={32} className="size-8 shrink-0 rounded-lg" /><span className="text-lg font-semibold tracking-tight">SymbolBundle</span></a>
        <nav aria-label="Main navigation" className="flex items-center gap-2 sm:gap-3"><a href="#come-funziona" onClick={() => document.getElementById('come-funziona')?.setAttribute('open', '')} className="hidden text-sm text-muted-foreground hover:text-foreground lg:block">How it works</a><ThemeToggle /><Button variant="outline" size="sm" aria-label="New project" disabled={busy || uploading} onClick={() => setResetOpen(true)}><Plus data-icon="inline-start" /><span className="hidden sm:inline">New project</span></Button></nav>
      </div>
    </header>
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 sm:py-10">
      <section data-studio-intro className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2"><h1 className="text-balance text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">From logo to delivery.</h1><p className="text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">Your logos, in the right formats. A clear guide. One ZIP.</p></div>
        <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground"><ShieldCheck className="size-4" />Your files stay in your browser</span>
      </section>
      <section id="workspace" data-studio-intro aria-label="Logo package generator" className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex min-h-14 items-center justify-between gap-3 border-b border-border px-5"><div className="flex min-w-0 items-center gap-2.5"><FolderArchive className="size-4 shrink-0 text-muted-foreground" /><h2 className="truncate text-sm font-medium">{project.name || 'Your new project'}</h2>{isDemo && <Badge variant="secondary">Sample</Badge>}</div><span className="shrink-0 text-sm text-muted-foreground">{project.assets.length} / 10 logos</span></div>
        <div className="grid items-stretch md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <ConfigPanel project={project} update={update} selectedId={selectedId} onSelect={setSelectedId} onUpload={upload} onRemove={remove} onDetect={() => void detectPalette()} onPhoto={file => void detectPalette(file)} tab={tab} onTab={setTab} busy={busy} uploading={uploading} onGuide={() => setGuideOpen(true)} onDemo={() => reset(true)} />
          <LogoPreview project={project} selectedId={selectedId} />
        </div>
        <div id="package-summary" className="min-w-0"><PackagePanel project={project} files={files} busy={busy} uploading={uploading} progress={progress} onDownload={download} validationError={validationError} finished={finished} /></div>
      </section>
      <p className="text-center text-sm text-muted-foreground">Free, with no account or watermark. No autosave: download your project before closing.</p>
      <HelpSection />
    </main>
    <footer className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-6 text-sm text-muted-foreground sm:px-8"><span>SymbolBundle</span><span>Made for designers.</span></footer>
    <Dialog open={resetOpen} onOpenChange={setResetOpen}><DialogContent><DialogHeader><DialogTitle>A fresh start?</DialogTitle><DialogDescription className="leading-relaxed">Your current project is stored only in memory and will be replaced. Download your files first if you want to keep them.</DialogDescription></DialogHeader><DialogFooter><Button variant="ghost" onClick={() => setResetOpen(false)}>Cancel</Button><Button variant="outline" onClick={() => reset(true)}>Load sample</Button><Button onClick={() => reset(false)}>New project</Button></DialogFooter></DialogContent></Dialog>
    <GuideDialog open={guideOpen} onOpenChange={setGuideOpen} project={project} />
    <Toaster theme={theme} position="bottom-right" closeButton />
  </StudioMotion>
}
