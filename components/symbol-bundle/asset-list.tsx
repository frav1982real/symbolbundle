'use client'

import { Eye, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type BundleProject, type LogoAsset, type LogoRole, roleOptions, svgDataUri } from '@/lib/bundle/model'
import { cn } from '@/lib/utils'

export function AssetList({ project, update, selectedId, onSelect, onRemove }: { project: BundleProject; update: (patch: Partial<BundleProject>) => void; selectedId: string; onSelect: (id: string) => void; onRemove: (id: string) => void }) {
  function patchAsset(asset: LogoAsset, patch: Partial<LogoAsset>) {
    update({ assets: project.assets.map(item => item.id === asset.id ? { ...item, ...patch } : item), ...(patch.role === 'app-icon' ? { iconAssetId: asset.id } : {}) })
  }
  return <ul className="flex flex-col gap-4" aria-label="Uploaded logos">
    {project.assets.map(asset => <li key={asset.id} data-motion-card className={cn('flex flex-col gap-4 rounded-xl border border-border p-4', selectedId === asset.id && 'border-primary/40')}>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onSelect(asset.id)} aria-pressed={selectedId === asset.id} aria-label={`Show ${asset.name}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left focus-visible:outline-2 focus-visible:outline-primary">
          <span className={cn('preview-art size-14 shrink-0 rounded-lg border border-border', asset.role === 'primary-dark' ? 'bg-stage-dark text-stage-dark-foreground' : 'bg-canvas text-canvas-foreground')}><img src={svgDataUri(asset.svg)} alt="" /></span>
          <span className="flex min-w-0 flex-col gap-1"><span className="truncate text-sm font-medium" title={asset.name}>{asset.name}</span><span className="text-sm text-muted-foreground">{Math.round(asset.width)} × {Math.round(asset.height)} · {asset.sourceType ? 'Raster' : 'Vector'}{asset.demo ? ' · Demo' : ''}</span></span>
        </button>
        <Button variant="ghost" size="icon-sm" onClick={() => onSelect(asset.id)} aria-label={`Preview ${asset.name}`}><Eye /></Button>
        <Button variant="ghost" size="icon-sm" onClick={() => onRemove(asset.id)} aria-label={`Remove ${asset.name}`}><X /></Button>
      </div>
      <FieldGroup className="gap-3">
        <Field>
          <FieldLabel htmlFor={`role-${asset.id}`}>Logo role</FieldLabel>
          <Select items={roleOptions} value={asset.role} onValueChange={value => { if (value) patchAsset(asset, { role: value as LogoRole }) }}>
            <SelectTrigger id={`role-${asset.id}`} className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent><SelectGroup>{roleOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectGroup></SelectContent>
          </Select>
          <FieldDescription>{roleOptions.find(option => option.value === asset.role)?.description}. You can change this at any time.</FieldDescription>
        </Field>
        {asset.role === 'custom' && <Field data-invalid={!asset.customName?.trim()}><FieldLabel htmlFor={`custom-${asset.id}`}>Custom name</FieldLabel><Input id={`custom-${asset.id}`} value={asset.customName || ''} maxLength={48} placeholder="e.g. Partnership logo" aria-invalid={!asset.customName?.trim()} onChange={event => patchAsset(asset, { customName: event.target.value })} /><FieldDescription>Used in the folder name and PDF guide.</FieldDescription></Field>}
      </FieldGroup>
      {asset.sourceType && <p className="text-sm leading-relaxed text-muted-foreground">Raster source: SVG and PDF embed the image without vectorizing it. Resolution remains the same as the uploaded file.</p>}
    </li>)}
  </ul>
}
