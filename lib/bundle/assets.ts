import { inferRole, type LogoAsset } from './model'
import { readSvgFile } from './svg'

export async function readLogoFile(file: File): Promise<LogoAsset> {
  if (/\.svg$/i.test(file.name)) return readSvgFile(file)
  if (!/\.(png|jpe?g|webp)$/i.test(file.name)) throw new Error(`${file.name}: use SVG, PNG, JPG, or WebP.`)
  if (file.size > 10 * 1024 * 1024) throw new Error(`${file.name}: maximum 10 MB per image.`)
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error(`${file.name}: unable to read image.`))
      image.src = url
    })
    if (image.naturalWidth > 8192 || image.naturalHeight > 8192 || !image.naturalWidth || !image.naturalHeight) throw new Error('Use images up to 8192 px per side.')
    const ratio = Math.min(1, 4096 / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Image conversion is unavailable in this browser.')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const { width, height } = canvas
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><image width="${width}" height="${height}" href="${canvas.toDataURL('image/png')}"/></svg>`
    return { id: crypto.randomUUID(), name: file.name, svg, width, height, role: inferRole(file.name, width, height), sourceType: 'raster' }
  } finally { URL.revokeObjectURL(url) }
}
