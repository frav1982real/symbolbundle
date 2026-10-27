'use client'

import { useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpFromLine, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { ExportSettings } from './export-settings'
import { AssetList } from './asset-list'
import { PalettePanel } from './palette-panel'
import { type BundleProject, type ConfigurationStep, getAccessibleStep, getLogoStepValidation, getPaletteValidation } from '@/lib/bundle/model'
import { cn } from '@/lib/utils'

interface Props {
  project: BundleProject
  update: (patch: Partial<BundleProject>) => void
  selectedId: string
  onSelect: (id: string) => void
  onUpload: (files: File[]) => void
  onRemove: (id: string) => void
  tab: ConfigurationStep
  onTab: (tab: ConfigurationStep) => void
  onContinue: () => void
  colorsReviewed: boolean
  busy: boolean
  uploading: boolean
  onGuide: () => void
  onDemo: () => void
  exportAction: ReactNode
}

const steps = [
  { value: 'logo', label: 'Logos', title: 'Start with your logos.', description: 'Upload your original SVGs. You can assign a role to each version.' },
  { value: 'colors', label: 'Colors', title: 'Review your brand colors.', description: 'Your SVG colors are extracted automatically. Review them, then continue.' },
  { value: 'export', label: 'Formats & Guide', title: 'Complete your delivery.', description: 'Choose formats, icons, and a 17-page guide for your brand.' },
] satisfies { value: ConfigurationStep; label: string; title: string; description: string }[]

export function ConfigPanel({ project, update, selectedId, onSelect, onUpload, onRemove, tab, onTab, onContinue, colorsReviewed, busy, uploading, onGuide, onDemo, exportAction }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const activeIndex = Math.max(0, steps.findIndex(step => step.value === tab))
  const stepError = tab === 'logo' ? getLogoStepValidation(project) : tab === 'colors' ? getPaletteValidation(project) : null
  return <section id="configuration" aria-label="Configure your package" className="flex min-w-0 flex-col bg-card text-card-foreground">
    <Tabs value={tab} onValueChange={value => { const step = steps.find(step => step.value === value); if (step) onTab(step.value) }} className="flex-1 gap-0">
      <div className="border-b border-border px-4 pt-4 sm:px-7">
        <TabsList variant="line" className="h-12 w-full" aria-label="Configuration steps">
          {steps.map((step, index) => <TabsTrigger key={step.value} value={step.value} disabled={busy || uploading || getAccessibleStep(project, step.value, colorsReviewed) !== step.value}><span className="font-mono text-sm text-muted-foreground">{index + 1}</span>{step.label}</TabsTrigger>)}
        </TabsList>
      </div>
      <div className="flex flex-col gap-1.5 px-5 pt-6 sm:px-7"><h2 className="text-xl font-semibold tracking-tight">{steps[activeIndex].title}</h2><p className="text-pretty text-sm leading-relaxed text-muted-foreground">{steps[activeIndex].description}</p></div>
      <fieldset disabled={busy || uploading} className="min-w-0 flex-1">
        <legend className="sr-only">Brand settings</legend>
        <TabsContent value="logo" className="p-5 sm:p-7">
          <FieldGroup className="gap-7">
            <Field data-invalid={!!project.assets.length && !project.name.trim()}><FieldLabel htmlFor="brand-name">Brand name</FieldLabel><Input id="brand-name" value={project.name} maxLength={60} aria-invalid={!!project.assets.length && !project.name.trim()} placeholder="e.g. Forma Studio" onChange={event => update({ name: event.target.value })} /></Field>
            <Field>
              <FieldLabel id="upload-label">Upload logos</FieldLabel>
              <input id="svg-upload" ref={inputRef} type="file" multiple accept=".svg,image/svg+xml" className="hidden" disabled={uploading || busy} onChange={event => { onUpload(Array.from(event.target.files || [])); event.target.value = '' }} />
              <button type="button" aria-labelledby="upload-label" disabled={uploading} className={cn('studio-upload flex min-h-36 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-input bg-background/50 p-5 text-foreground transition-colors hover:border-primary/60 focus-visible:outline-2 focus-visible:outline-primary', dragging && 'border-primary bg-primary/5')} onClick={() => inputRef.current?.click()} onDragOver={event => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); onUpload(Array.from(event.dataTransfer.files)) }}>
                {uploading ? <Loader2 className="size-6 animate-spin text-primary" /> : <ArrowUpFromLine className="size-6 text-primary" />}
                <span className="flex flex-col gap-1 text-center"><span className="text-sm font-medium">{uploading ? 'Analyzing files and colors…' : 'Drop files or browse'}</span><span className="text-sm text-muted-foreground">SVG files only</span></span>
              </button>
              <FieldDescription>Up to 10 SVG files · 1 MB each · colors extracted automatically.</FieldDescription>
              {!project.assets.length && <p className="text-sm text-muted-foreground">No file handy? <button type="button" onClick={onDemo} className="font-medium text-primary underline underline-offset-4">Try a sample</button></p>}
            </Field>
            {!!project.assets.length && !!project.colors.length && <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border py-3"><div className="flex items-center gap-3"><span className="text-sm text-muted-foreground">Detected palette</span><ul aria-label="Detected brand colors" className="flex gap-1.5">{project.colors.map((color, index) => <li key={`${color}-${index}`} title={color} aria-label={color} className="size-5 border border-foreground/15" style={{ backgroundColor: color }} />)}</ul></div><Button variant="link" disabled={!!stepError} onClick={onContinue}>Review colors<ArrowRight data-icon="inline-end" /></Button></div>}
            {!!project.assets.length && <div className="flex flex-col gap-4"><div className="flex items-center justify-between"><h3 className="text-base font-medium">Logo versions</h3><span className="text-sm text-muted-foreground">{project.assets.length} / 10</span></div><AssetList project={project} update={update} selectedId={selectedId} onSelect={onSelect} onRemove={onRemove} /></div>}
          </FieldGroup>
        </TabsContent>
        <TabsContent value="colors" className="p-5 sm:p-7"><PalettePanel project={project} update={update} /></TabsContent>
        <TabsContent value="export" className="p-5 sm:p-7"><ExportSettings project={project} update={update} onGuide={onGuide} /></TabsContent>
      </fieldset>
      <div className="flex flex-col gap-3 border-t border-border p-5 sm:px-7">
        {stepError && <p id="step-requirement" role="status" className="text-sm text-muted-foreground">{stepError}</p>}
        <div className="flex items-center justify-between gap-3"><Button variant="ghost" disabled={activeIndex === 0 || busy || uploading} onClick={() => onTab(steps[activeIndex - 1].value)}><ArrowLeft data-icon="inline-start" />Back</Button>{activeIndex < steps.length - 1 ? <Button disabled={busy || uploading || !!stepError} aria-describedby={stepError ? 'step-requirement' : undefined} onClick={onContinue}>Continue<ArrowRight data-icon="inline-end" /></Button> : exportAction}</div>
      </div>
    </Tabs>
  </section>
}
