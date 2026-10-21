import { svgDataUri } from './model'

export async function renderSvg(svg: string, width: number, height: number, background?: string, padding = 0): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.min(4096, Math.round(width)))
  canvas.height = Math.max(1, Math.min(4096, Math.round(height)))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Your browser does not support image conversion.')
  if (background) {
    context.fillStyle = background
    context.fillRect(0, 0, canvas.width, canvas.height)
  }
  const image = new Image()
  image.crossOrigin = 'anonymous'
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Unable to render the SVG. Make sure it contains only embedded resources.'))
    image.src = svgDataUri(svg)
  })
  const availableWidth = canvas.width * (1 - padding * 2)
  const availableHeight = canvas.height * (1 - padding * 2)
  const scale = Math.min(availableWidth / image.width, availableHeight / image.height)
  const drawWidth = image.width * scale
  const drawHeight = image.height * scale
  context.drawImage(image, (canvas.width - drawWidth) / 2, (canvas.height - drawHeight) / 2, drawWidth, drawHeight)
  return canvas
}

export async function canvasBlob(canvas: HTMLCanvasElement, mime = 'image/png'): Promise<Blob> {
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mime, 0.94))
  if (!blob || blob.type !== mime) throw new Error(`Your browser does not support ${mime} export. Deselect this format and try again.`)
  return blob
}

export function fitDimensions(width: number, height: number, maxSize: number) {
  const factor = maxSize / Math.max(width, height)
  return { width: Math.max(1, Math.round(width * factor)), height: Math.max(1, Math.round(height * factor)) }
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}
