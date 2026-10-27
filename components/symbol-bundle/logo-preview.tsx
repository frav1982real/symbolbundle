'use client'

import { useMemo, useState } from 'react'
import { Expand, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { type BundleProject, type LogoVariant, getRoleLabel, svgDataUri } from '@/lib/bundle/model'
import { recolorSvg } from '@/lib/bundle/svg'
import { cn } from '@/lib/utils'

const backgrounds = [{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'transparent', label: 'Transparent' }]
const variants = [{ value: 'original', label: 'Original' }, { value: 'black', label: 'Black' }, { value: 'white', label: 'White' }] as const

export function LogoPreview({ project, selectedId }: { project: BundleProject; selectedId: string }) {
  const asset = project.assets.find(item => item.id === selectedId) || project.assets[0]
  const [selection, setSelection] = useState({ id: '', variant: 'original' as LogoVariant, surface: 'light' })
  const [expanded, setExpanded] = useState(false)
  const variant = selection.id === asset?.id ? selection.variant : 'original'
  const surface = selection.id === asset?.id ? selection.surface : asset?.role === 'primary-dark' ? 'dark' : 'light'
  const svg = useMemo(() => asset ? svgDataUri(recolorSvg(asset.svg, variant)) : '', [asset, variant])
  const surfaceClass = surface === 'dark' ? 'bg-stage-dark text-stage-dark-foreground' : surface === 'transparent' ? 'checkerboard text-canvas-foreground' : 'bg-canvas text-canvas-foreground'

  return <section aria-label="Logo preview" className="flex min-w-0 flex-col text-foreground">
    <div className="flex h-16 items-center justify-between gap-2 px-5 sm:px-6"><h2 className="text-sm font-medium">Preview</h2><Button variant="ghost" size="icon-sm" disabled={!asset} onClick={() => setExpanded(true)} aria-label="Expand preview"><Expand /></Button></div>
    <div className="flex flex-1 flex-col gap-3 px-5 pb-5 sm:px-6">
      {asset ? <>
        <Tabs value={variant} onValueChange={value => { const next = value as LogoVariant; setSelection({ id: asset.id, variant: next, surface: next === 'white' || (next === 'original' && asset.role === 'primary-dark') ? 'dark' : 'light' }) }} className="gap-4">
          <TabsList aria-label="Logo variation" className="w-full">{variants.map(item => <TabsTrigger key={item.value} value={item.value}>{item.label}</TabsTrigger>)}</TabsList>
          {variants.map(item => <TabsContent value={item.value} key={item.value}><div className={cn('preview-art aspect-[1.8] w-full min-h-40 max-h-64 overflow-hidden rounded-lg border border-border', surfaceClass)}><img src={svg} alt={`${project.name}, ${item.label.toLowerCase()}`} /></div></TabsContent>)}
        </Tabs>
        <div className="flex items-center justify-between gap-3"><span className="text-sm text-muted-foreground">Background</span><Select items={backgrounds} value={surface} onValueChange={value => setSelection({ id: asset.id, variant, surface: value || 'light' })}><SelectTrigger aria-label="Preview background" className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{backgrounds.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent></Select></div>
        <div className="flex min-w-0 flex-col gap-1 border-t border-border pt-4"><p className="truncate text-sm font-medium" title={asset.name}>{asset.name}</p><p className="text-sm text-muted-foreground">{getRoleLabel(asset)} · {Math.round(asset.width)} × {Math.round(asset.height)} px</p></div>
        <p className="text-sm leading-relaxed text-muted-foreground">Preview only. Choose the variations included in your ZIP in Formats &amp; Guide.</p>
      </> : <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-input p-6 text-center min-h-48"><span className="flex size-12 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground"><ImageIcon className="size-5" strokeWidth={1.5} /></span><p className="text-sm font-medium">Your brand takes shape here</p><p className="max-w-52 text-sm leading-relaxed text-muted-foreground">Upload a logo to check colors, variations, and backgrounds.</p></div>}
    </div>
    <Dialog open={expanded} onOpenChange={setExpanded}><DialogContent className="sm:max-w-3xl"><DialogHeader><DialogTitle>{project.name || 'Logo preview'}</DialogTitle><DialogDescription>{asset?.name} · {variants.find(item => item.value === variant)?.label}</DialogDescription></DialogHeader><div className={cn('preview-art aspect-[1.5] rounded-lg', surfaceClass)}>{asset && <img src={svg} alt={project.name} />}</div></DialogContent></Dialog>
  </section>
}
