'use client'

import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpFromLine, BookOpen, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { AssetList } from './asset-list'
import { PalettePanel } from './palette-panel'
import { useStudioTransition } from './studio-motion'
import { type BundleProject, type ExportFormat, type GuideLanguage, type LogoVariant, formatDetails, languageOptions, variantLabels } from '@/lib/bundle/model'
import { cn } from '@/lib/utils'

interface Props {
  project: BundleProject
  update: (patch: Partial<BundleProject>) => void
  selectedId: string
  onSelect: (id: string) => void
  onUpload: (files: File[]) => void
  onRemove: (id: string) => void
  onDetect: () => void
  onPhoto: (file: File) => void
  tab: string
  onTab: (tab: string) => void
  busy: boolean
  uploading: boolean
  onGuide: () => void
  onDemo: () => void
}

const steps = [
  { value: 'logo', label: 'Logos', title: 'Start with your logos.', description: 'Upload your original files. You can assign a role to each version.' },
  { value: 'colors', label: 'Colors', title: 'Review your brand colors.', description: 'The palette is detected from your logos. Adjust it if needed.' },
  { value: 'export', label: 'Formats', title: 'Choose what to deliver.', description: 'Digital formats, print files, and icons.' },
  { value: 'guide', label: 'Guide', title: 'Complete your delivery.', description: 'A 17-page guide using your actual project details.' },
]

export function ConfigPanel({ project, update, selectedId, onSelect, onUpload, onRemove, onDetect, onPhoto, tab, onTab, busy, uploading, onGuide, onDemo }: Props) {
  const motionRef = useStudioTransition<HTMLElement>(tab)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const activeIndex = Math.max(0, steps.findIndex(step => step.value === tab))
  const toggleFormat = (format: ExportFormat, checked: boolean) => update({ formats: checked ? [...project.formats, format] : project.formats.filter(item => item !== format) })
  const toggleVariant = (variant: LogoVariant, checked: boolean) => update({ variants: checked ? [...project.variants, variant] : project.variants.filter(item => item !== variant) })
  return <section ref={motionRef} aria-label="Configure your package" className="flex min-w-0 flex-col bg-card text-card-foreground">
    <Tabs value={tab} onValueChange={value => onTab(String(value))} className="flex-1 gap-0">
      <div className="border-b border-border px-4 pt-4 sm:px-7">
        <TabsList variant="line" className="h-12 w-full" aria-label="Configuration steps">
          {steps.map((step, index) => <TabsTrigger key={step.value} value={step.value}><span className="font-mono text-sm text-muted-foreground">{index + 1}</span>{step.label}</TabsTrigger>)}
        </TabsList>
      </div>
      <div data-motion-item className="flex flex-col gap-1.5 px-5 pt-6 sm:px-7"><h2 className="text-xl font-semibold tracking-tight">{steps[activeIndex].title}</h2><p className="text-pretty text-sm leading-relaxed text-muted-foreground">{steps[activeIndex].description}</p></div>
      <fieldset disabled={busy || uploading} className="min-w-0 flex-1">
        <legend className="sr-only">Brand settings</legend>
        <TabsContent data-motion-item value="logo" className="p-5 sm:p-7">
          <FieldGroup className="gap-7">
            <Field data-invalid={!!project.assets.length && !project.name.trim()}><FieldLabel htmlFor="brand-name">Brand name</FieldLabel><Input id="brand-name" value={project.name} maxLength={60} aria-invalid={!!project.assets.length && !project.name.trim()} placeholder="e.g. Forma Studio" onChange={event => update({ name: event.target.value })} /></Field>
            <Field>
              <FieldLabel htmlFor="svg-upload">Upload logos</FieldLabel>
              <input id="svg-upload" ref={inputRef} type="file" multiple accept=".svg,.png,.jpg,.jpeg,.webp,image/svg+xml,image/png,image/jpeg,image/webp" className="sr-only" disabled={uploading || busy} onChange={event => { onUpload(Array.from(event.target.files || [])); event.target.value = '' }} />
              <button type="button" disabled={uploading} className={cn('studio-upload flex min-h-36 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-input bg-background/50 p-5 text-foreground transition-colors hover:border-primary/60 focus-visible:outline-2 focus-visible:outline-primary', dragging && 'border-primary bg-primary/5')} onClick={() => inputRef.current?.click()} onDragOver={event => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); onUpload(Array.from(event.dataTransfer.files)) }}>
                {uploading ? <Loader2 className="size-6 animate-spin text-primary" /> : <ArrowUpFromLine className="size-6 text-primary" />}
                <span className="flex flex-col gap-1 text-center"><span className="text-sm font-medium">{uploading ? 'Analyzing files and colors…' : 'Drop files or browse'}</span><span className="text-sm text-muted-foreground">SVG, PNG, JPG, WebP</span></span>
              </button>
              <FieldDescription>Up to 10 files · SVG: 1 MB · images: 10 MB.</FieldDescription>
              {!project.assets.length && <p className="text-sm text-muted-foreground">No file handy? <button type="button" onClick={onDemo} className="font-medium text-primary underline underline-offset-4">Try a sample</button></p>}
            </Field>
            {!!project.assets.length && <div className="flex flex-col gap-4"><div className="flex items-center justify-between"><h3 className="text-base font-medium">Logo versions</h3><span className="text-sm text-muted-foreground">{project.assets.length} / 10</span></div><AssetList project={project} update={update} selectedId={selectedId} onSelect={onSelect} onRemove={onRemove} /></div>}
          </FieldGroup>
        </TabsContent>
        <TabsContent data-motion-item value="colors" className="p-5 sm:p-7"><PalettePanel project={project} update={update} onDetect={onDetect} onPhoto={onPhoto} /></TabsContent>
        <TabsContent data-motion-item value="export" className="p-5 sm:p-7">
          <FieldGroup className="gap-7">
            <FieldSet><FieldLegend>Package formats</FieldLegend><div className="grid grid-cols-2 gap-3">{formatDetails.map(format => <FieldLabel key={format.value} htmlFor={`format-${format.value}`}><Field orientation="horizontal"><Checkbox id={`format-${format.value}`} checked={project.formats.includes(format.value)} onCheckedChange={checked => toggleFormat(format.value, checked)} /><FieldContent><span className="text-sm font-medium">{format.label}</span><span className="text-sm text-muted-foreground">{format.description}</span></FieldContent></Field></FieldLabel>)}</div></FieldSet>
            <Separator />
            <FieldSet><FieldLegend>Color variations</FieldLegend><FieldGroup className="gap-3">{(['original', 'black', 'white'] as LogoVariant[]).map(variant => <Field key={variant} orientation="horizontal"><Checkbox id={`variant-${variant}`} checked={project.variants.includes(variant)} onCheckedChange={checked => toggleVariant(variant, checked)} /><FieldLabel htmlFor={`variant-${variant}`}>{variantLabels[variant]}</FieldLabel></Field>)}</FieldGroup><FieldDescription>The original version preserves its colors and assigned role.</FieldDescription></FieldSet>
            <Separator />
            <Field><FieldLabel htmlFor="base-size">Base longest edge</FieldLabel><div className="flex items-center gap-3"><Input id="base-size" type="number" min={64} max={2048} step={1} value={project.baseSize || ''} onChange={event => update({ baseSize: Number(event.target.value) })} /><span className="text-sm text-muted-foreground">px</span></div><FieldDescription>Longest-edge size. A 512 px base at 2× creates a 1024 px image. JPG uses only the base size.</FieldDescription></Field>
            <FieldSet><FieldLegend variant="label">PNG and WebP sizes</FieldLegend><div className="flex flex-wrap gap-4">{[1, 2, 3, 4, 8].map(scale => <Field key={scale} orientation="horizontal" className="w-auto"><Checkbox id={`scale-${scale}`} checked={project.scales.includes(scale)} onCheckedChange={checked => update({ scales: checked ? [...project.scales, scale].sort((a, b) => a - b) : project.scales.filter(item => item !== scale) })} /><FieldLabel htmlFor={`scale-${scale}`}>{scale}×</FieldLabel></Field>)}</div><FieldDescription>Final limit: 4096 px on the longest edge.</FieldDescription></FieldSet>
            <Field><FieldLabel htmlFor="jpg-bg">Image and icon background</FieldLabel><input id="jpg-bg" type="color" value={project.jpgBackground} onChange={event => update({ jpgBackground: event.target.value })} className="h-10 w-full cursor-pointer rounded border border-input bg-background p-1 text-foreground" /><FieldDescription>Dark-background logos use a black background in JPG files.</FieldDescription></Field>
            <Separator />
            <Field orientation="horizontal"><FieldContent><FieldLabel htmlFor="include-icons">Favicon, app icons, and avatars</FieldLabel><FieldDescription>Three dedicated folders with instructions and Icon Composer layers.</FieldDescription></FieldContent><Switch id="include-icons" checked={project.includeIcons} onCheckedChange={checked => update({ includeIcons: checked })} /></Field>
            {project.includeIcons && <Field><FieldLabel htmlFor="icon-source">Icon source</FieldLabel><Select items={project.assets.map(asset => ({ value: asset.id, label: asset.name }))} value={project.iconAssetId || project.assets[0]?.id || null} onValueChange={value => update({ iconAssetId: value || '' })}><SelectTrigger id="icon-source" className="w-full"><SelectValue placeholder="Select a logo" /></SelectTrigger><SelectContent><SelectGroup>{project.assets.map(asset => <SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>)}</SelectGroup></SelectContent></Select><FieldDescription>The “App icon source” role automatically selects this file.</FieldDescription></Field>}
            <p className="text-sm leading-relaxed text-muted-foreground">CMYK uses mathematical conversion without an ICC profile. EPS files are raster, not vector; PDFs preserve vectors from flat-color SVG sources. PDFs with photos or gradients use RGB, indicated in the filename. Check files with your printer.</p>
          </FieldGroup>
        </TabsContent>
        <TabsContent data-motion-item value="guide" className="p-5 sm:p-7">
          <FieldGroup className="gap-7">
            <Field orientation="horizontal"><FieldContent><FieldLabel htmlFor="include-guide">Include the PDF guide</FieldLabel><FieldDescription>17 landscape pages, without watermarks.</FieldDescription></FieldContent><Switch id="include-guide" checked={project.includeGuide} onCheckedChange={checked => update({ includeGuide: checked })} /></Field>
            <Field data-disabled={!project.includeGuide}><FieldLabel htmlFor="guide-language">Guide language</FieldLabel><Select disabled={!project.includeGuide} items={languageOptions} value={project.guideLanguage} onValueChange={value => update({ guideLanguage: (value || 'en') as GuideLanguage })}><SelectTrigger id="guide-language" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{languageOptions.map(language => <SelectItem key={language.value} value={language.value}>{language.label}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
            <div className="flex flex-col gap-5 rounded-xl border border-border bg-background/50 p-5"><BookOpen className="size-6 text-primary" /><h3 className="text-base font-medium">From files to real-world use.</h3><ol className="flex flex-col gap-3 text-sm text-muted-foreground">{['Package, palette, and original versions', 'Clear space, variations, and backgrounds', 'Incorrect usage and additional logos', 'Icons, avatars, and brand applications'].map(item => <li key={item}>{item}</li>)}</ol><p className="text-sm leading-relaxed text-muted-foreground">The guide shows the files actually included. Clear space and applications are proposals, not approved brand rules.</p></div>
            <Button variant="outline" disabled={!project.assets.length} onClick={onGuide}><BookOpen data-icon="inline-start" />Preview and download PDF</Button>
          </FieldGroup>
        </TabsContent>
      </fieldset>
      <div className="flex items-center justify-between border-t border-border p-5 sm:px-7"><Button variant="ghost" disabled={activeIndex === 0 || busy || uploading} onClick={() => onTab(steps[activeIndex - 1].value)}><ArrowLeft data-icon="inline-start" />Back</Button>{activeIndex < 3 ? <Button disabled={busy || uploading} onClick={() => onTab(steps[activeIndex + 1].value)}>Continue<ArrowRight data-icon="inline-end" /></Button> : <span className="flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="size-4" />{project.assets.length ? 'Review the summary below' : 'Add a logo to export'}</span>}</div>
    </Tabs>
  </section>
}
