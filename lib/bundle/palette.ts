import { type LogoAsset, hexToRgb } from './model'
import { fitDimensions, renderSvg } from './raster'
import { extractColors } from './svg'

const toHex = (rgb: number[]) => `#${rgb.map(value => Math.round(value).toString(16).padStart(2, '0')).join('')}`.toUpperCase()
const distance = (a: string, b: string) => Math.hypot(...hexToRgb(a).map((value, index) => value - hexToRgb(b)[index]))

export function mergePalette(colors: string[], limit = 5): string[] {
  const result: string[] = []
  for (const color of colors) if (!result.some(existing => distance(existing, color) < 32)) {
    result.push(color.toUpperCase())
    if (result.length === limit) break
  }
  return result
}

export function paletteFromPixels(pixels: ArrayLike<number>, limit = 5): string[] {
  const buckets = new Map<number, { count: number; shades: Map<string, number> }>()
  for (let offset = 0; offset < pixels.length; offset += 4) {
    if (pixels[offset + 3] < 192) continue
    const rgb = [pixels[offset], pixels[offset + 1], pixels[offset + 2]]
    const key = (rgb[0] >> 4) * 256 + (rgb[1] >> 4) * 16 + (rgb[2] >> 4)
    const bucket = buckets.get(key) || { count: 0, shades: new Map<string, number>() }
    const hex = toHex(rgb)
    bucket.count++
    bucket.shades.set(hex, (bucket.shades.get(hex) || 0) + 1)
    buckets.set(key, bucket)
  }
  const candidates = [...buckets.values()].map(bucket => {
    const color = [...bucket.shades].sort((a, b) => b[1] - a[1])[0][0]
    const rgb = hexToRgb(color)
    const saturation = (Math.max(...rgb) - Math.min(...rgb)) / 255
    return { color, count: bucket.count, score: bucket.count * (1 + saturation), saturation }
  }).sort((a, b) => b.score - a.score)
  const largest = candidates[0]?.count || 0
  const significant = candidates.filter(candidate => candidate.count >= Math.max(2, largest * 0.005))
  const palette = mergePalette(significant.map(candidate => candidate.color), limit)
  const chromatic = palette.find(color => { const rgb = hexToRgb(color); return Math.max(...rgb) - Math.min(...rgb) > 45 })
  return chromatic ? [chromatic, ...palette.filter(color => color !== chromatic)] : palette
}

export async function extractAssetColors(asset: LogoAsset): Promise<string[]> {
  const dimensions = fitDimensions(asset.width, asset.height, 256)
  const canvas = await renderSvg(asset.svg, dimensions.width, dimensions.height)
  const context = canvas.getContext('2d', { willReadFrequently: true })!
  const sampled = paletteFromPixels(context.getImageData(0, 0, canvas.width, canvas.height).data)
  return mergePalette([...sampled, ...(asset.sourceType ? [] : extractColors(asset.svg))])
}
