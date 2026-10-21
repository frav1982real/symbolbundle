import DOMPurify from 'dompurify'
import { inferRole, type LogoAsset, type LogoVariant } from './model'

export async function readSvgFile(file: File): Promise<LogoAsset> {
  if (!file.name.toLowerCase().endsWith('.svg')) throw new Error(`${file.name}: upload an SVG file.`)
  if (file.size > 1024 * 1024) throw new Error(`${file.name}: maximum size 1 MB.`)
  const source = await file.text()
  if (/<!DOCTYPE|<!ENTITY/i.test(source)) throw new Error('Unsupported SVG: remove DOCTYPE and entity declarations.')
  const original = new DOMParser().parseFromString(source, 'image/svg+xml')
  if (original.documentElement.localName !== 'svg' || original.querySelector('parsererror')) throw new Error(`${file.name}: invalid SVG file.`)
  const hasExternalCss = (value: string) => /@import|expression\s*\(|url\s*\(/i.test(value.replace(/url\(\s*(?:#[\w:.-]+|'#[\w:.-]+'|"#[\w:.-]+")\s*\)/gi, ''))
  const clean = DOMPurify.sanitize(source, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ['use'],
    FORBID_TAGS: ['script', 'foreignObject', 'image', 'a', 'animate', 'animateMotion', 'animateTransform', 'set'],
  })
  const document = new DOMParser().parseFromString(clean, 'image/svg+xml')
  const root = document.documentElement
  if (root.localName !== 'svg' || document.querySelector('parsererror')) throw new Error(`${file.name}: invalid SVG file.`)
  if (root.querySelectorAll('*').length > 5000) throw new Error('SVG is too complex: simplify the artwork before uploading.')
  for (const element of [root, ...Array.from(root.querySelectorAll('*'))]) {
    for (const attribute of Array.from(element.attributes)) {
      const value = attribute.value.trim()
      if (attribute.name.toLowerCase().startsWith('on') || ((attribute.localName === 'href' || attribute.localName === 'src') && !value.startsWith('#')) || hasExternalCss(value)) element.removeAttribute(attribute.name)
    }
  }
  for (const style of Array.from(root.querySelectorAll('style'))) {
    if (hasExternalCss(style.textContent || '')) style.remove()
  }
  const viewBox = root.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number)
  const toPixels = (value: string | null) => {
    const match = value?.trim().match(/^(\d*\.?\d+(?:e[+-]?\d+)?)\s*(px|pt|pc|mm|cm|in|q)?$/i)
    const units: Record<string, number> = { px: 1, pt: 96 / 72, pc: 16, mm: 96 / 25.4, cm: 96 / 2.54, in: 96, q: 96 / 101.6 }
    return match ? Number(match[1]) * (units[(match[2] || 'px').toLowerCase()]) : NaN
  }
  const width = viewBox?.length === 4 ? viewBox[2] : toPixels(root.getAttribute('width'))
  const height = viewBox?.length === 4 ? viewBox[3] : toPixels(root.getAttribute('height'))
  if ((viewBox && (viewBox.length !== 4 || !viewBox.every(Number.isFinite))) || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0 || Math.max(width / height, height / width) > 100) {
    throw new Error('Define a valid viewBox or dimensions in your SVG (maximum ratio 100:1).')
  }
  if (!viewBox) root.setAttribute('viewBox', `0 0 ${width} ${height}`)
  root.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  root.setAttribute('width', String(width))
  root.setAttribute('height', String(height))
  return { id: crypto.randomUUID(), name: file.name, svg: new XMLSerializer().serializeToString(root), width, height, role: inferRole(file.name, width, height) }
}

export function recolorSvg(svg: string, variant: LogoVariant): string {
  if (variant === 'original') return svg
  const document = new DOMParser().parseFromString(svg, 'image/svg+xml')
  const root = document.documentElement
  const color = variant === 'white' ? '#FFFFFF' : '#000000'
  const images = root.querySelectorAll('image')
  if (images.length) {
    const defs = document.createElementNS(root.namespaceURI, 'defs')
    const filter = document.createElementNS(root.namespaceURI, 'filter')
    const matrix = document.createElementNS(root.namespaceURI, 'feColorMatrix')
    filter.setAttribute('id', 'symbolbundle-monochrome')
    matrix.setAttribute('type', 'matrix')
    const channel = variant === 'white' ? 1 : 0
    matrix.setAttribute('values', `0 0 0 0 ${channel} 0 0 0 0 ${channel} 0 0 0 0 ${channel} 0 0 0 1 0`)
    filter.appendChild(matrix)
    defs.appendChild(filter)
    root.appendChild(defs)
    images.forEach(image => image.setAttribute('filter', 'url(#symbolbundle-monochrome)'))
  }
  root.setAttribute('color', color)
  if (!root.hasAttribute('fill')) root.setAttribute('fill', color)
  const replacePaint = (style: string) => style.replace(/(fill|stroke|color)\s*:\s*([^;}]+)/gi, (match, prop: string, value: string) => /^(none|transparent)\b/i.test(value.trim()) ? match : `${prop}:${color}${value.includes('!important') ? ' !important' : ''}`)
  for (const style of Array.from(root.querySelectorAll('style'))) style.textContent = replacePaint(style.textContent || '')
  for (const node of [root, ...Array.from(root.querySelectorAll('*'))]) {
    const parent = node.closest('defs, clipPath, mask')
    if (parent) continue
    for (const property of ['fill', 'stroke']) {
      if (node.hasAttribute(property) && !/^(none|transparent)$/i.test(node.getAttribute(property) || '')) node.setAttribute(property, color)
    }
    const style = node.getAttribute('style')
    if (style) node.setAttribute('style', replacePaint(style))
  }
  return new XMLSerializer().serializeToString(root)
}

export function extractColors(svg: string): string[] {
  const colors = [...svg.matchAll(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi)].map(match => {
    const color = match[0].toUpperCase()
    return color.length === 4 ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}` : color
  })
  for (const match of svg.matchAll(/rgba?\(\s*([\d.]+)(%)?\s*[, ]\s*([\d.]+)(%)?\s*[, ]\s*([\d.]+)(%)?(?:\s*[,/]\s*([\d.]+)(%)?)?\s*\)/gi)) {
    if (match[7] !== undefined && Number(match[7]) === 0) continue
    const rgb = [1, 3, 5].map(index => Math.max(0, Math.min(255, Math.round(Number(match[index]) * (match[index + 1] ? 2.55 : 1)))))
    colors.push(`#${rgb.map(value => value.toString(16).padStart(2, '0')).join('')}`.toUpperCase())
  }
  return [...new Set(colors)].slice(0, 5)
}
