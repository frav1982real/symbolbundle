'use client'

import { useEffect, useState } from 'react'
import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { type BundleProject, type GuideLanguage, type LogoVariant, formatDetails, getRasterValidation, languageOptions, variantLabels } from '@/lib/bundle/model'

export function ExportSettings({ project, update, onGuide }: { project: BundleProject; update: (patch: Partial<BundleProject>) => void; onGuide: () => void }) {
  const hasRaster = project.formats.some(format => ['png', 'jpg', 'webp'].includes(format))
  const usesScales = project.formats.some(format => format === 'png' || format === 'webp')
  const rasterError = getRasterValidation(project)
  const invalidBase = !Number.isInteger(project.baseSize) || project.baseSize < 64 || project.baseSize > 2048
  const [rasterOpen, setRasterOpen] = useState(false)

  useEffect(() => { if (rasterError) setRasterOpen(true) }, [rasterError])

  return <FieldGroup className="gap-6">
    <FieldSet data-invalid={!project.formats.length}>
      <FieldLegend>Package formats</FieldLegend>
      <div className="grid grid-cols-2 gap-3">{formatDetails.map(format => <Field key={format.value} orientation="horizontal"><Checkbox id={`format-${format.value}`} checked={project.formats.includes(format.value)} aria-invalid={!project.formats.length} onCheckedChange={checked => update({ formats: checked ? [...project.formats, format.value] : project.formats.filter(item => item !== format.value) })} /><FieldContent><FieldLabel htmlFor={`format-${format.value}`}>{format.label}</FieldLabel><FieldDescription>{format.description}</FieldDescription></FieldContent></Field>)}</div>
      {!project.formats.length && <FieldDescription role="status">Select at least one format.</FieldDescription>}
    </FieldSet>
    <FieldSet data-invalid={!project.variants.length}>
      <FieldLegend>Color variations</FieldLegend>
      <div className="flex flex-wrap gap-x-5 gap-y-3">{(['original', 'black', 'white'] as LogoVariant[]).map(variant => <Field key={variant} orientation="horizontal" className="w-auto"><Checkbox id={`variant-${variant}`} checked={project.variants.includes(variant)} aria-invalid={!project.variants.length} onCheckedChange={checked => update({ variants: checked ? [...project.variants, variant] : project.variants.filter(item => item !== variant) })} /><FieldLabel htmlFor={`variant-${variant}`}>{variantLabels[variant]}</FieldLabel></Field>)}</div>
      <FieldDescription>{project.variants.length ? 'Original keeps the colors and role of each uploaded logo.' : 'Select at least one color variation.'}</FieldDescription>
    </FieldSet>
    {hasRaster && <details open={rasterOpen} onToggle={event => setRasterOpen(event.currentTarget.open)} className="studio-disclosure border-y border-border">
      <summary className="py-4 text-sm font-medium">Raster size &amp; background<span className="block text-sm font-normal text-muted-foreground">{invalidBase ? 'Check the image size below' : `${project.baseSize} px base${usesScales ? ` · ${project.scales.length} sizes` : ' · JPG at base size'}`}</span></summary>
      <FieldGroup className="gap-5 pb-5 pt-1">
        <Field data-invalid={invalidBase}><FieldLabel htmlFor="base-size">Base longest edge</FieldLabel><div className="flex items-center gap-3"><Input id="base-size" type="number" min={64} max={2048} step={1} value={project.baseSize || ''} aria-invalid={invalidBase} aria-describedby="raster-requirement" onChange={event => update({ baseSize: Number(event.target.value) })} /><span className="text-sm text-muted-foreground">px</span></div><FieldDescription>A 512 px base at 2× creates a 1024 px image. JPG uses only the base size.</FieldDescription></Field>
        {usesScales && <FieldSet><FieldLegend variant="label">PNG and WebP sizes</FieldLegend><div className="flex flex-wrap gap-4">{[1, 2, 3, 4, 8].map(scale => <Field key={scale} orientation="horizontal" className="w-auto"><Checkbox id={`scale-${scale}`} checked={project.scales.includes(scale)} aria-invalid={!!rasterError} onCheckedChange={checked => update({ scales: checked ? [...project.scales, scale].sort((a, b) => a - b) : project.scales.filter(item => item !== scale) })} /><FieldLabel htmlFor={`scale-${scale}`}>{scale}×</FieldLabel></Field>)}</div></FieldSet>}
        <p id="raster-requirement" role={rasterError ? 'status' : undefined} className="text-sm leading-relaxed text-muted-foreground">{rasterError || 'Final limit: 4096 px on the longest edge.'}</p>
        <Field><FieldLabel htmlFor="jpg-bg">Image and icon background</FieldLabel><input id="jpg-bg" type="color" value={project.jpgBackground} onChange={event => update({ jpgBackground: event.target.value })} className="h-10 w-full cursor-pointer border border-input bg-background p-1 text-foreground" /><FieldDescription>White variations and dark-background logos use black in JPG files.</FieldDescription></Field>
      </FieldGroup>
    </details>}
    <FieldSet>
      <Field orientation="horizontal"><FieldContent><FieldLabel htmlFor="include-icons">Favicons, app icons &amp; avatars</FieldLabel><FieldDescription>Dedicated folders, setup instructions, and Icon Composer layers.</FieldDescription></FieldContent><Switch id="include-icons" checked={project.includeIcons} onCheckedChange={checked => update({ includeIcons: checked })} /></Field>
      {project.includeIcons && <Field><FieldLabel htmlFor="icon-source">Icon source</FieldLabel><Select items={project.assets.map(asset => ({ value: asset.id, label: asset.name }))} value={project.iconAssetId || project.assets[0]?.id || null} onValueChange={value => update({ iconAssetId: value || '' })}><SelectTrigger id="icon-source" className="w-full"><SelectValue placeholder="Select a logo" /></SelectTrigger><SelectContent><SelectGroup>{project.assets.map(asset => <SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>)}</SelectGroup></SelectContent></Select><FieldDescription>A symbol or monogram usually works best at small sizes.</FieldDescription></Field>}
      {!hasRaster && project.includeIcons && <Field><FieldLabel htmlFor="icon-bg">Icon background</FieldLabel><input id="icon-bg" type="color" value={project.jpgBackground} onChange={event => update({ jpgBackground: event.target.value })} className="h-10 w-full cursor-pointer border border-input bg-background p-1 text-foreground" /></Field>}
    </FieldSet>
    <Separator />
    <FieldSet>
      <Field orientation="horizontal"><FieldContent><FieldLabel htmlFor="include-guide">Include the PDF guide</FieldLabel><FieldDescription>17 landscape pages with your files, palette, and usage proposals.</FieldDescription></FieldContent><Switch id="include-guide" checked={project.includeGuide} onCheckedChange={checked => update({ includeGuide: checked })} /></Field>
      {project.includeGuide && <Field><FieldLabel htmlFor="guide-language">Guide language</FieldLabel><Select items={languageOptions} value={project.guideLanguage} onValueChange={value => update({ guideLanguage: (value || 'en') as GuideLanguage })}><SelectTrigger id="guide-language" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{languageOptions.map(language => <SelectItem key={language.value} value={language.value}>{language.label}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>}
      <Button variant="outline" disabled={!project.assets.length} onClick={onGuide}><BookOpen data-icon="inline-start" />Preview and download PDF</Button>
      {!project.includeGuide && <FieldDescription>The guide is excluded from your ZIP. You can still download it separately.</FieldDescription>}
    </FieldSet>
    <details className="studio-disclosure border-t border-border"><summary className="py-4 text-sm text-muted-foreground">Print and brand-guide notes</summary><div className="flex flex-col gap-3 pb-2 text-sm leading-relaxed text-muted-foreground"><p>CMYK uses mathematical conversion without an ICC profile. EPS files are raster, not vector; PDFs preserve vectors from flat-color SVG sources. PDFs with gradients use RGB, indicated in the filename. Check files with your printer.</p><p>Clear space and applications in the guide are proposals, not approved brand rules.</p></div></details>
  </FieldGroup>
}
