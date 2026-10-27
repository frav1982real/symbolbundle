'use client'

import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FieldDescription, FieldLegend, FieldSet } from '@/components/ui/field'
import { type BundleProject } from '@/lib/bundle/model'

export function PalettePanel({ project, update }: { project: BundleProject; update: (patch: Partial<BundleProject>) => void }) {
  return <div className="flex flex-col gap-7">
    <FieldSet>
      <FieldLegend>Brand palette</FieldLegend>
      <FieldDescription>{project.colors.length ? 'Colors are extracted automatically from your uploaded SVGs. Review or edit them, then continue to confirm your palette.' : 'No visible colors were detected in your SVGs. Add at least one color to continue.'}</FieldDescription>
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
