import { type BundleProject, type PlannedFile, getFilePlan, getProjectValidation, hexToRgb, rgbToCmyk, slugify } from './model'
import { canvasBlob, fitDimensions, renderSvg } from './raster'
import { recolorSvg } from './svg'
import { createGuide } from './guide'

async function vectorPdf(svg: string, width: number, height: number): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  await import('svg2pdf.js')
  const dims = fitDimensions(width, height, 1000)
  const pdf = new jsPDF({ unit: 'pt', format: [dims.width, dims.height], orientation: dims.width >= dims.height ? 'landscape' : 'portrait' })
  if (/<image\b/i.test(svg)) {
    const canvas = await renderSvg(svg, dims.width, dims.height)
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, dims.width, dims.height)
    return pdf.output('blob')
  }
  if (!/<(?:linearGradient|radialGradient)\b/i.test(svg)) {
    for (const method of ['setFillColor', 'setDrawColor', 'setTextColor'] as const) {
      type ColorSetter = (first: number | string, second?: number, third?: number, fourth?: number) => typeof pdf
      const setters = pdf as unknown as Record<typeof method, ColorSetter>
      const original = setters[method].bind(pdf)
      setters[method] = (...channels) => {
        if (channels[3] !== undefined) return original(...channels)
        const rgb = typeof channels[0] === 'string' && /^#[0-9a-f]{6}$/i.test(channels[0]) ? hexToRgb(channels[0]) : channels[2] !== undefined ? channels.slice(0, 3).map(Number) as [number, number, number] : [Number(channels[0]), Number(channels[0]), Number(channels[0])] as [number, number, number]
        const cmyk = rgbToCmyk(...rgb).map(value => value / 100)
        return original(cmyk[0], cmyk[1], cmyk[2], cmyk[3])
      }
    }
  }
  const element = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement as unknown as SVGElement
  await pdf.svg(element, { x: 0, y: 0, width: dims.width, height: dims.height })
  return pdf.output('blob')
}

async function rasterEps(svg: string, width: number, height: number, background: string): Promise<string> {
  const dims = fitDimensions(width, height, 1200)
  const canvas = await renderSvg(svg, dims.width, dims.height, background)
  const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data
  const lines: string[] = []
  let line = ''
  for (let i = 0; i < pixels.length; i += 4) {
    const values = rgbToCmyk(pixels[i], pixels[i + 1], pixels[i + 2]).map(v => Math.round(v * 2.55))
    line += values.map(v => v.toString(16).padStart(2, '0')).join('')
    if (line.length >= 128) { lines.push(line); line = '' }
  }
  if (line) lines.push(line)
  return `%!PS-Adobe-3.0 EPSF-3.0\n%%BoundingBox: 0 0 ${canvas.width} ${canvas.height}\n%%Creator: SymbolBundle\n%%Title: CMYK raster image (no ICC profile)\n%%LanguageLevel: 2\n%%EndComments\ngsave\n${canvas.width} ${canvas.height} scale\n/DeviceCMYK setcolorspace\n<< /ImageType 1 /Width ${canvas.width} /Height ${canvas.height} /BitsPerComponent 8 /Decode [0 1 0 1 0 1 0 1] /ImageMatrix [${canvas.width} 0 0 -${canvas.height} 0 ${canvas.height}] /DataSource currentfile /ASCIIHexDecode filter >> image\n${lines.join('\n')}\n>\ngrestore\nshowpage\n%%EOF\n`
}

async function favicon(svg: string): Promise<Blob> {
  const sizes = [16, 32, 48]
  const images = await Promise.all(sizes.map(async size => {
    const canvas = await renderSvg(svg, size, size, undefined, 0.08)
    return new Uint8Array(await (await canvasBlob(canvas)).arrayBuffer())
  }))
  const headerSize = 6 + 16 * sizes.length
  const data = new Uint8Array(headerSize + images.reduce((sum, image) => sum + image.length, 0))
  const view = new DataView(data.buffer)
  view.setUint16(2, 1, true)
  view.setUint16(4, sizes.length, true)
  let offset = headerSize
  images.forEach((image, i) => {
    const position = 6 + i * 16
    view.setUint8(position, sizes[i])
    view.setUint8(position + 1, sizes[i])
    view.setUint16(position + 4, 1, true)
    view.setUint16(position + 6, 32, true)
    view.setUint32(position + 8, image.length, true)
    view.setUint32(position + 12, offset, true)
    data.set(image, offset)
    offset += image.length
  })
  return new Blob([data], { type: 'image/x-icon' })
}

const notes = `LOGO PACKAGE\n\nFiles generated with SymbolBundle.\n\nSVG: RGB. PDFs from flat-color SVGs use mathematical CMYK conversion without an ICC profile. PDFs with gradients or embedded images use RGB (indicated in the filename); arrange conversion with your printer. PNG, JPG, and WebP sources remain raster inside SVG and PDF files: they are not vectorized. Convert text to outlines before uploading to avoid font substitutions.\nPNG: transparent. JPG: configured background; white variations use a dark background. WebP: web image.\nEPS (if selected): RASTER CMYK image at 1200 px on the longest edge, with a solid background. Not a vector EPS. No ICC profile is included.\nPalette CMYK values are approximate mathematical conversions, not a color proof. PDF and EPS files are NOT PDF/X certified or ready for every printing process: consult your printer.\n\nRaster dimensions are calculated on the longest edge. Favicons preserve proportions with inner padding.\nPDF guide: automatic recommendations to review and approve before delivery.\n\nSource files are processed only in your browser; no backup is created.\n`

export async function generateBundle(project: BundleProject, onProgress: (completed: number, total: number, filename: string) => void) {
  const validationError = getProjectValidation(project)
  if (validationError) throw new Error(validationError)
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  const root = zip
  const plan = getFilePlan(project)
  const assets = new Map(project.assets.map(asset => [asset.id, asset]))
  for (let index = 0; index < plan.length; index++) {
    const file: PlannedFile = plan[index]
    onProgress(index, plan.length, file.path.split('/').pop()!)
    let result: Blob | string
    const asset = file.assetId ? assets.get(file.assetId) : undefined
    const svg = asset ? recolorSvg(asset.svg, file.variant || 'original') : ''
    const background = file.background || (file.variant === 'white' || (file.variant === 'original' && asset?.role === 'primary-dark') ? '#000000' : project.jpgBackground)
    switch (file.kind) {
      case 'svg': {
        if (file.variant) { result = svg; break }
        const source = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement
        const size = file.iconSize || 96
        const padding = file.padding ?? 0.025
        const factor = size * (1 - 2 * padding) / Math.max(asset!.width, asset!.height)
        const width = asset!.width * factor, height = asset!.height * factor
        source.setAttribute('width', String(width))
        source.setAttribute('height', String(height))
        source.setAttribute('x', String((size - width) / 2))
        source.setAttribute('y', String((size - height) / 2))
        result = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${new XMLSerializer().serializeToString(source)}</svg>`
        break
      }
      case 'pdf': result = await vectorPdf(svg, asset!.width, asset!.height); break
      case 'eps': result = await rasterEps(svg, asset!.width, asset!.height, background); break
      case 'png':
      case 'jpg':
      case 'webp': {
        const dims = file.iconSize ? { width: file.iconSize, height: file.iconSize } : fitDimensions(asset!.width, asset!.height, project.baseSize * (file.scale || 1))
        const mime = file.kind === 'jpg' ? 'image/jpeg' : `image/${file.kind}`
        const canvas = await renderSvg(svg, dims.width, dims.height, file.kind === 'jpg' || file.background ? background : undefined, file.padding ?? 0)
        result = await canvasBlob(canvas, mime)
        break
      }
      case 'ico': result = await favicon(svg); break
      case 'manifest': result = JSON.stringify({ name: project.name, short_name: project.name.slice(0, 12), start_url: '/', display: 'standalone', background_color: project.jpgBackground, theme_color: project.colors[0], icons: [192, 512].map(size => ({ src: `icon-${size}.png`, sizes: `${size}x${size}`, type: 'image/png', purpose: 'any' })) }, null, 2); break
      case 'setup': result = '<!doctype html><html lang="en"><meta charset="utf-8"><title>Favicon setup</title><h1>Favicon setup</h1><p>Copy the files in this folder to your website root. Add these tags to the head section:</p><pre>&lt;link rel="icon" href="/favicon.svg" type="image/svg+xml"&gt;\n&lt;link rel="icon" href="/favicon.ico" sizes="any"&gt;\n&lt;link rel="icon" href="/favicon-96.png" sizes="96x96"&gt;</pre><p>Also copy the App_Icon files to the root to use apple-touch-icon.png and site.webmanifest. Connect the manifest with a link rel="manifest" tag.</p></html>'; break
      case 'icon-notes': result = 'ICON COMPOSER\n\n1024 x 1024 canvas. Import background.png and foreground.svg (or foreground.png) as layers aligned to the same origin. The foreground layer includes 20% padding on each side. Do not add extra padding when importing.\n\nRaster sources remain raster inside SVG and PDF files.\n'; break
      case 'background': {
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = file.iconSize || 1024
        const context = canvas.getContext('2d')!
        context.fillStyle = background
        context.fillRect(0, 0, canvas.width, canvas.height)
        result = await canvasBlob(canvas)
        break
      }
      case 'guide': result = await createGuide(project); break
      case 'colors': result = JSON.stringify({ brand: project.name, cmykNote: 'Approximate mathematical conversion, no ICC profile', colors: project.colors.map(hex => ({ hex, rgb: hexToRgb(hex), cmyk: rgbToCmyk(...hexToRgb(hex)) })) }, null, 2); break
      case 'notes': result = notes; break
    }
    // JSZip does not reliably read browser Blobs in every preview runtime.
    root.file(file.path, result instanceof Blob ? await result.arrayBuffer() : result)
    await new Promise(resolve => setTimeout(resolve, 0))
  }
  onProgress(plan.length, plan.length, 'Compressing package…')
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 5 } })
  return { blob, filename: `${slugify(project.name)}_Logo_Asset_Pack.zip`, count: plan.length }
}
