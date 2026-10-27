'use client'

import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldDescription, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field'
import { type BundleProject } from '@/lib/bundle/model'

export function PalettePanel({ project, update }: { project: BundleProject; update: (patch: Partial<BundleProject>) => void }) {
  return <div className="flex flex-col gap-7">
    <FieldSet>
      <FieldLegend>Brand palette</FieldLegend>
      <FieldDescription>{project.colors.length ? 'Colors are extracted automatically from your uploaded SVGs. Review or edit them, then continue to confirm your palette.' : 'No visible colors were detected in your SVGs. Add at least one color to continue.'}</FieldDescription>
      <div className="flex flex-col gap-3">
        {project.colors.map((color, index) => {
          const valid = /^#[0-9a-f]{6}$/i.test(color)
          const setColor = (value: string) => update({ colors: project.colors.map((item, i) => i === index ? value.toUpperCase() : item) })
          return <div key={index} className="flex items-center gap-4 border border-border p-3">
            <label className="brand-swatch size-12 shrink-0 overflow-hidden border border-foreground/10 bg-background focus-within:ring-2 focus-within:ring-primary" style={{ backgroundColor: valid ? color : undefined }}>
              <span className="sr-only">Choose color {index + 1}</span><input type="color" value={valid ? color : '#000000'} onChange={event => setColor(event.target.value)} />
            </label>
            <Field data-invalid={!valid} className="min-w-0 flex-1 gap-1.5"><FieldLabel htmlFor={`palette-${index}`}>{index === 0 ? 'Primary color' : `Color ${index + 1}`}</FieldLabel><Input id={`palette-${index}`} value={color} maxLength={7} spellCheck={false} autoComplete="off" aria-invalid={!valid} aria-describedby={!valid ? `palette-error-${index}` : undefined} onChange={event => setColor(event.target.value.startsWith('#') ? event.target.value : `#${event.target.value}`)} />{!valid && <FieldDescription id={`palette-error-${index}`}>Enter a 6-digit HEX color, such as #49111C.</FieldDescription>}</Field>
            {project.colors.length > 1 && <Button variant="ghost" size="icon-sm" onClick={() => update({ colors: project.colors.filter((_, i) => i !== index) })} aria-label={`Remove color ${index + 1}`}><X /></Button>}
          </div>
        })}
        {project.colors.length < 5 && <Button variant="outline" onClick={() => update({ colors: [...project.colors, '#F38B60'] })}><Plus data-icon="inline-start" />Add a color</Button>}
      </div>
      <FieldDescription>The palette updates the PDF guide and color file. It does not automatically recolor original logos.</FieldDescription>
    </FieldSet>
  </div>
}
