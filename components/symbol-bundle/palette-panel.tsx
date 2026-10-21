'use client'

import { useRef } from 'react'
import { ImagePlus, Pipette, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FieldDescription, FieldLegend, FieldSet } from '@/components/ui/field'
import { type BundleProject } from '@/lib/bundle/model'

export function PalettePanel({ project, update, onDetect, onPhoto }: { project: BundleProject; update: (patch: Partial<BundleProject>) => void; onDetect: () => void; onPhoto: (file: File) => void }) {
  const photoInput = useRef<HTMLInputElement>(null)
  return <div className="flex flex-col gap-7">
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-background/50 p-4">
      <h4 className="font-medium">Start with your files</h4>
      <p className="text-sm leading-relaxed text-muted-foreground">Extract up to 5 colors from uploaded logos or a reference photo. Transparent areas are ignored.</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={!project.assets.length} onClick={onDetect}><Pipette data-icon="inline-start" />Detect from logos</Button>
        <Button variant="outline" onClick={() => photoInput.current?.click()}><ImagePlus data-icon="inline-start" />Extract from a photo</Button>
      </div>
      <input ref={photoInput} id="palette-photo" type="file" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" className="sr-only" aria-label="Photo for palette extraction" onChange={event => { const file = event.target.files?.[0]; if (file) onPhoto(file); event.target.value = '' }} />
      <p className="text-sm text-muted-foreground">PNG, JPG, or WebP · up to 10 MB · the photo is not included in the package.</p>
    </div>
    <FieldSet>
      <FieldLegend>Brand palette</FieldLegend>
      <FieldDescription>Detected colors are suggestions: confirm or edit them before delivery.</FieldDescription>
      <div className="flex flex-col gap-3">
        {project.colors.map((color, index) => <div key={index} className="flex items-center gap-4 rounded-lg border border-border p-3">
          <label className="brand-swatch size-12 shrink-0 overflow-hidden rounded-md border border-foreground/10 focus-within:ring-2 focus-within:ring-primary" style={{ backgroundColor: color }}>
            <span className="sr-only">Color {index + 1}</span><input type="color" value={color} onChange={event => update({ colors: project.colors.map((item, i) => i === index ? event.target.value.toUpperCase() : item) })} />
          </label>
          <div className="flex flex-1 flex-col gap-1"><span className="text-sm font-medium">{index === 0 ? 'Primary color' : `Color ${index + 1}`}</span><span className="font-mono text-sm text-muted-foreground">{color}</span></div>
          {project.colors.length > 1 && <Button variant="ghost" size="icon-sm" onClick={() => update({ colors: project.colors.filter((_, i) => i !== index) })} aria-label={`Remove color ${index + 1}`}><X /></Button>}
        </div>)}
        {project.colors.length < 5 && <Button variant="outline" onClick={() => update({ colors: [...project.colors, '#F38B60'] })}><Plus data-icon="inline-start" />Add a color</Button>}
      </div>
      <FieldDescription>The palette updates the PDF guide and color file. It does not automatically recolor original logos.</FieldDescription>
    </FieldSet>
  </div>
}
