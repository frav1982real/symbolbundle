'use client'

import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { FolderArchive, Plus, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Toaster } from '@/components/ui/sonner'
import { ConfigPanel } from './config-panel'
import { LogoPreview } from './logo-preview'
import { PackageDownloadButton, PackagePanel } from './package-panel'
import { SiteFooter, SiteHeader } from './site-chrome'
import { GuideDialog } from './guide-dialog'
import { StudioMotion } from './studio-motion'
import { useStudioTheme } from './studio-theme'
import { type BundleProject, type ConfigurationStep, type LogoAsset, createDemoProject, createEmptyProject, getAccessibleStep, getFilePlan, getLogoStepValidation, getPaletteValidation, getProjectValidation } from '@/lib/bundle/model'
import { readLogoFile } from '@/lib/bundle/assets'
import { extractAssetColors, mergePalette } from '@/lib/bundle/palette'
import { saveBlob } from '@/lib/bundle/raster'

export function BundleWorkspace() {
  const router = useRouter()
  const { theme, ready } = useStudioTheme()
  const [project, setProject] = useState<BundleProject>(createEmptyProject)
  const [selectedId, setSelectedId] = useState('')
  const [requestedTab, setTab] = useState<ConfigurationStep>('logo')
  const [colorsReviewed, setColorsReviewed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [finished, setFinished] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [progress, setProgress] = useState({ completed: 0, total: 0, filename: '' })
  const allowNavigation = useRef(false)
  const uploadLock = useRef(false)
  const exportLock = useRef(false)
  const files = useMemo(() => getFilePlan(project), [project])
  const isDemo = project.assets.length > 0 && project.assets.every(asset => asset.demo)
  const tab = getAccessibleStep(project, requestedTab, colorsReviewed)
  const validationError = getProjectValidation(project) || (!colorsReviewed ? 'Review and confirm your palette in step 2.' : null)

  const hasUnsavedChanges = !finished && !isDemo && (!!project.name.trim() || project.assets.length > 0)
  const reviewStep: ConfigurationStep = getLogoStepValidation(project) ? 'logo' : !colorsReviewed || getPaletteValidation(project) ? 'colors' : 'export'
  const reviewLabel = reviewStep === 'logo' ? 'Review logos' : reviewStep === 'colors' ? 'Review colors' : 'Review export settings'
  const percentage = progress.total ? Math.round(progress.completed / progress.total * 100) : 0

  useEffect(() => {
    if (!hasUnsavedChanges && !busy && !uploading) return
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      if (allowNavigation.current) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
  }, [hasUnsavedChanges, busy, uploading])

  function leaveWorkspace(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    if (busy || uploading) {
      event.preventDefault()
      toast.info('Wait for the current operation to finish before leaving.')
    } else if (hasUnsavedChanges) {
      event.preventDefault()
      setLeaveOpen(true)
    }
  }

  function showStep(next: ConfigurationStep) {
    setTab(next)
    requestAnimationFrame(() => {
      document.getElementById('configuration')?.scrollIntoView({ block: 'start', behavior: 'instant' })
      document.querySelector<HTMLElement>('[aria-label="Configuration steps"] [aria-selected="true"]')?.focus({ preventScroll: true })
    })
  }

  function update(patch: Partial<BundleProject>) {
    setProject(current => ({ ...current, ...patch }))
    if (patch.colors) setColorsReviewed(false)
    setFinished(false)
  }

  function navigate(next: ConfigurationStep) {
    if (busy || uploading || getAccessibleStep(project, next, colorsReviewed) !== next) return
    showStep(next)
  }

  function continueStep() {
    if (busy || uploading) return
    if (tab === 'logo' && !getLogoStepValidation(project)) showStep('colors')
    if (tab === 'colors' && !getPaletteValidation(project)) {
      setColorsReviewed(true)
      showStep('export')
    }
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
      update({ assets, iconAssetId: icon.id, colors, ...(isDemo || !project.name.trim() ? { name: loaded[0].name.replace(/\.[^.]+$/i, '').replace(/[_-]/g, ' ').slice(0, 60) } : {}) })
      setSelectedId(loaded[0].id)
      toast.success(`${loaded.length === 1 ? 'Logo uploaded' : `${loaded.length} logos uploaded`}. Your package is taking shape.`)
    }
    setUploading(false)
    uploadLock.current = false
  }

  function remove(id: string) {
    const index = project.assets.findIndex(asset => asset.id === id)
    const removed = project.assets[index]
    if (!removed) return
    const assets = project.assets.filter(asset => asset.id !== id)
    update({ assets, iconAssetId: project.iconAssetId === id ? assets[0]?.id || '' : project.iconAssetId, ...(!assets.length ? { colors: [] } : {}) })
    if (selectedId === id) setSelectedId(assets[0]?.id || '')
    toast('Logo removed.', { duration: 10000, description: removed.name, action: { label: 'Undo', onClick: () => {
      if (exportLock.current || uploadLock.current) return
      setProject(current => {
        if (current.assets.length >= 10 || current.assets.some(asset => asset.id === id)) return current
        const restored = [...current.assets]
        restored.splice(Math.min(index, restored.length), 0, removed)
        return { ...current, assets: restored, iconAssetId: current.iconAssetId || id, colors: current.colors.length ? current.colors : project.colors }
      })
      setSelectedId(id)
      setFinished(false)
    } } })
  }

  function reset(demo: boolean) {
    toast.dismiss()
    setProject(demo ? createDemoProject() : createEmptyProject())
    setSelectedId(demo ? 'demo-primary' : '')
    setTab('logo')
    setColorsReviewed(false)
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

  return <StudioMotion ready={ready}>
    <a href="#workspace" className="sr-only rounded bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50">Skip to generator</a>
    <SiteHeader page="generate" onNavigateHome={leaveWorkspace}>
      <Button variant="outline" size="sm" aria-label="New project" disabled={busy || uploading} onClick={() => setResetOpen(true)}><Plus data-icon="inline-start" /><span className="hidden sm:inline">New project</span></Button>
    </SiteHeader>
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 sm:py-10">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2"><h1 className="text-balance text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">From logo to delivery.</h1><p className="text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">Your logos, in the right formats. A clear guide. One ZIP.</p></div>
        <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground"><ShieldCheck className="size-4" />Your files stay in your browser</span>
      </section>
      <section id="workspace" aria-label="Logo package generator" className="rounded-xl border border-border bg-card text-card-foreground">
        <div className="flex min-h-14 items-center justify-between gap-3 border-b border-border px-5"><div className="flex min-w-0 items-center gap-2.5"><FolderArchive className="size-4 shrink-0 text-muted-foreground" /><h2 className="truncate text-sm font-medium">{project.name || 'Your new project'}</h2>{isDemo && <Badge variant="secondary">Sample</Badge>}</div><span className="shrink-0 text-sm text-muted-foreground">{project.assets.length} / 10 logos</span></div>
        <div className="grid items-stretch md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <ConfigPanel project={project} update={update} selectedId={selectedId} onSelect={setSelectedId} onUpload={upload} onRemove={remove} tab={tab} onTab={navigate} onContinue={continueStep} colorsReviewed={colorsReviewed} busy={busy} uploading={uploading} onGuide={() => setGuideOpen(true)} onDemo={() => reset(true)} exportAction={<PackageDownloadButton busy={busy} uploading={uploading} percentage={percentage} onDownload={download} validationError={validationError} finished={finished} />} />
          <div className="min-w-0 border-t border-border bg-muted/30 text-foreground md:border-t-0 md:border-l"><div className="workspace-companion"><LogoPreview project={project} selectedId={selectedId} /><div id="package-summary" className="min-w-0"><PackagePanel project={project} files={files} busy={busy} uploading={uploading} progress={progress} onDownload={download} validationError={validationError} finished={finished} onReview={() => showStep(reviewStep)} reviewLabel={reviewLabel} /></div></div></div>
        </div>
      </section>
      <p className="text-center text-sm text-muted-foreground">Free, with no account or watermark. No autosave: download your project before closing.</p>
    </main>
    <SiteFooter onNavigateHome={leaveWorkspace} />
    <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}><DialogContent><DialogHeader><DialogTitle>Leave without your files?</DialogTitle><DialogDescription className="leading-relaxed">Your project has not been downloaded. Leaving this page clears your logos and settings.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setLeaveOpen(false)}>Keep editing</Button><Button onClick={() => { allowNavigation.current = true; setLeaveOpen(false); router.push('/') }}>Leave page</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={resetOpen} onOpenChange={setResetOpen}><DialogContent><DialogHeader><DialogTitle>A fresh start?</DialogTitle><DialogDescription className="leading-relaxed">Your current project is stored only in memory and will be replaced. Download your files first if you want to keep them.</DialogDescription></DialogHeader><DialogFooter><Button variant="ghost" onClick={() => setResetOpen(false)}>Cancel</Button><Button variant="outline" onClick={() => reset(true)}>Load sample</Button><Button onClick={() => reset(false)}>New project</Button></DialogFooter></DialogContent></Dialog>
    <GuideDialog open={guideOpen} onOpenChange={setGuideOpen} project={project} />
    <Toaster theme={theme} position="bottom-right" closeButton />
  </StudioMotion>
}
