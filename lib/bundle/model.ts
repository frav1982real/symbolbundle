export type ExportFormat = 'svg' | 'png' | 'jpg' | 'webp' | 'pdf' | 'eps'
export type LogoVariant = 'original' | 'black' | 'white'
export type GuideLanguage = 'it' | 'en' | 'es' | 'fr' | 'de'
export type LogoRole = 'primary' | 'primary-dark' | 'horizontal' | 'vertical' | 'logomark' | 'monogram' | 'wordmark' | 'app-icon' | 'custom'

export const roleOptions: { value: LogoRole; label: string; folder: string; description: string }[] = [
  { value: 'primary', label: 'Primary logo', folder: 'Primary_Logo', description: 'Primary logo for light backgrounds' },
  { value: 'primary-dark', label: 'Dark-background logo', folder: 'Primary_Logo_Dark', description: 'Original version for dark backgrounds' },
  { value: 'horizontal', label: 'Horizontal logo', folder: 'Horizontal_Logo', description: 'Horizontal layout' },
  { value: 'vertical', label: 'Vertical logo', folder: 'Vertical_Logo', description: 'Vertical layout' },
  { value: 'logomark', label: 'Symbol', folder: 'Logo_Mark', description: 'Symbol without the brand name' },
  { value: 'monogram', label: 'Monogram', folder: 'Monogram', description: 'Initials or monogram' },
  { value: 'wordmark', label: 'Wordmark (text only)', folder: 'Wordmark', description: 'Brand name in typographic form' },
  { value: 'app-icon', label: 'App icon source', folder: 'App_Icon_Source', description: 'Preferred source for favicons and icons' },
  { value: 'custom', label: 'Custom name', folder: 'Custom', description: 'A version with a custom name' },
]

export function getRoleLabel(asset: LogoAsset) {
  return asset.role === 'custom' ? asset.customName?.trim() || 'Custom name' : roleOptions.find(option => option.value === asset.role)?.label || 'Primary logo'
}

export function inferRole(name: string, width: number, height: number): LogoRole {
  if (/dark|negativ|on.black|scuro/i.test(name)) return 'primary-dark'
  if (/app.?icon|favicon/i.test(name)) return 'app-icon'
  if (/monogram/i.test(name)) return 'monogram'
  if (/wordmark/i.test(name)) return 'wordmark'
  if (/logomark|logo.mark|symbol|simbolo|pittogramma/i.test(name)) return 'logomark'
  if (/vertical/i.test(name)) return 'vertical'
  if (/horizontal|orizzontale/i.test(name)) return 'horizontal'
  return width / height < 0.7 ? 'vertical' : 'primary'
}

export interface LogoAsset {
  id: string
  name: string
  svg: string
  width: number
  height: number
  role: LogoRole
  customName?: string
  sourceType?: 'raster'
  demo?: boolean
}

export interface BundleProject {
  name: string
  assets: LogoAsset[]
  colors: string[]
  formats: ExportFormat[]
  scales: number[]
  baseSize: number
  variants: LogoVariant[]
  jpgBackground: string
  includeIcons: boolean
  iconAssetId: string
  includeGuide: boolean
  guideLanguage: GuideLanguage
}

export interface PlannedFile {
  path: string
  kind: ExportFormat | 'ico' | 'manifest' | 'guide' | 'colors' | 'notes' | 'setup' | 'icon-notes' | 'background'
  assetId?: string
  variant?: LogoVariant
  scale?: number
  iconSize?: number
  padding?: number
  background?: string
}

const mark = '<g fill="#F38B60"><path d="M8 8h28v28H8zM40 40h28v28H40z"/><path d="M40 8h28v28H40zM8 40h28v28H8z" opacity=".55"/></g>'
const wordmark = `<svg xmlns="http://www.w3.org/2000/svg" width="330" height="90" viewBox="0 0 330 90"><g transform="translate(4 7)">${mark}</g><text x="96" y="65" font-family="Arial, Helvetica, sans-serif" font-size="67" font-weight="700" letter-spacing="-4" fill="#141615">forma</text></svg>`
const logomark = `<svg xmlns="http://www.w3.org/2000/svg" width="76" height="76" viewBox="0 0 76 76">${mark}</svg>`

export function createDemoProject(): BundleProject {
  return {
    name: 'Forma Studio',
    assets: [
      { id: 'demo-primary', name: 'Primary_logo.svg', svg: wordmark, width: 330, height: 90, role: 'primary', demo: true },
      { id: 'demo-mark', name: 'Symbol.svg', svg: logomark, width: 76, height: 76, role: 'logomark', demo: true },
    ],
    colors: ['#F38B60', '#141615', '#EEEFEB'],
    formats: ['svg', 'png', 'jpg', 'webp', 'pdf'],
    scales: [1, 2, 4, 8],
    baseSize: 512,
    variants: ['original', 'black', 'white'],
    jpgBackground: '#EEEFEB',
    includeIcons: true,
    iconAssetId: 'demo-mark',
    includeGuide: true,
    guideLanguage: 'en',
  }
}

export function createEmptyProject(): BundleProject {
  return { ...createDemoProject(), name: '', assets: [], colors: [], iconAssetId: '' }
}

export type ConfigurationStep = 'logo' | 'colors' | 'export'

export function getLogoStepValidation(project: BundleProject): string | null {
  if (!project.assets.length) return 'Upload at least one SVG logo.'
  if (project.assets.some(asset => !roleOptions.some(option => option.value === asset.role))) return 'Assign a valid role to every logo.'
  if (project.assets.some(asset => asset.role === 'custom' && !asset.customName?.trim())) return 'Name every custom role.'
  if (!project.name.trim()) return 'Name your brand to continue.'
  if (project.assets.length > 10) return 'You can add up to 10 logos per project.'
  return null
}

export function getPaletteValidation(project: BundleProject): string | null {
  if (!project.colors.length || project.colors.length > 5 || project.colors.some(color => !/^#[0-9a-f]{6}$/i.test(color))) return 'Use 1 to 5 valid HEX colors.'
  return null
}

export function getAccessibleStep(project: BundleProject, requested: ConfigurationStep, colorsReviewed: boolean): ConfigurationStep {
  if (requested === 'logo' || getLogoStepValidation(project)) return 'logo'
  if (requested === 'colors' || !colorsReviewed || getPaletteValidation(project)) return 'colors'
  return 'export'
}

export function getProjectValidation(project: BundleProject): string | null {
  const logoError = getLogoStepValidation(project)
  if (logoError) return logoError
  if (!project.formats.length) return 'Select at least one format.'
  if (!project.variants.length) return 'Select at least one color variation.'
  if (project.formats.some(format => !formatDetails.some(item => item.value === format))) return 'Unsupported format.'
  if (project.variants.some(variant => !['original', 'black', 'white'].includes(variant))) return 'Unsupported variation.'
  const hasRaster = project.formats.some(format => ['png', 'jpg', 'webp'].includes(format))
  if (hasRaster && !project.scales.length) return 'Select at least one raster scale.'
  if (hasRaster && (!Number.isInteger(project.baseSize) || project.baseSize < 64 || project.baseSize > 2048 || project.scales.some(scale => ![1, 2, 3, 4, 8].includes(scale)) || project.baseSize * Math.max(...project.scales) > 4096)) return 'Choose a whole-number longest edge between 64 and 2048 px, with a final size no greater than 4096 px.'
  const paletteError = getPaletteValidation(project)
  if (paletteError) return paletteError
  if (!/^#[0-9a-f]{6}$/i.test(project.jpgBackground)) return 'Use a valid HEX background color.'
  return null
}

export const formatDetails: { value: ExportFormat; label: string; description: string }[] = [
  { value: 'svg', label: 'SVG', description: 'Vector' },
  { value: 'png', label: 'PNG', description: 'Transparent' },
  { value: 'jpg', label: 'JPG', description: 'Solid background' },
  { value: 'webp', label: 'WebP', description: 'Lightweight, for the web' },
  { value: 'pdf', label: 'PDF', description: 'Flat-color CMYK' },
  { value: 'eps', label: 'EPS', description: 'Raster CMYK' },
]

export const variantLabels: Record<LogoVariant, string> = { original: 'Original', black: 'Black', white: 'White' }
export const languageOptions = [
  { value: 'it', label: 'Italian' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
]

export function slugify(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'Brand'
}

export function getAssetFolder(asset: LogoAsset, index: number) {
  const name = asset.role === 'custom' ? slugify(asset.customName || 'Custom') : roleOptions.find(option => option.value === asset.role)?.folder || 'Primary_Logo'
  return `${String(index + 1).padStart(2, '0')}_${name}`
}

export function getIconFolders(project: BundleProject) {
  const folder = (offset: number, name: string) => `${String(project.assets.length + offset).padStart(2, '0')}_${name}`
  return { favicon: folder(1, 'Favicon'), app: folder(2, 'App_Icon'), avatar: folder(3, 'Avatar') }
}

export function getIconAsset(project: BundleProject) {
  return project.assets.find(asset => asset.id === project.iconAssetId) || project.assets.find(asset => asset.role === 'app-icon') || project.assets.find(asset => asset.role === 'logomark') || project.assets[0]
}

export function getFilePlan(project: BundleProject): PlannedFile[] {
  if (!project.assets.length) return []
  const files: PlannedFile[] = []
  project.assets.forEach((asset, index) => {
    const base = getAssetFolder(asset, index)
    const label = base.replace(/^\d+_/, '').replaceAll('_', '-').toLowerCase()
    for (const variant of project.variants) {
      for (const format of project.formats) {
        const folder = { svg: '01_RGB_Digital/01_SVG', png: '01_RGB_Digital/02_PNG_Transparent', jpg: '01_RGB_Digital/03_JPG', webp: '01_RGB_Digital/04_WEBP', eps: '02_CMYK_Print/01_EPS', pdf: '02_CMYK_Print/02_PDF' }[format]
        const colorSpace = format === 'eps' || (format === 'pdf' && !asset.sourceType && !/<(?:linearGradient|radialGradient|image)\b/i.test(asset.svg)) ? 'cmyk' : 'rgb'
        const color = variant === 'original' ? asset.role === 'primary-dark' ? 'original-on-black' : asset.role === 'primary' ? 'original-on-white' : 'original' : variant
        const stem = `${slugify(project.name).replaceAll('_', '-').toLowerCase()}-${label}-${colorSpace}-${color}`
        if (['png', 'webp'].includes(format)) {
          const scales = [...project.scales].sort((a, b) => a - b)
          scales.forEach((scale, sizeIndex) => {
            const sizeName = ['Small', 'Medium', 'Large', 'Extra_Large'][sizeIndex] || `Size_${sizeIndex + 1}`
            files.push({ path: `${base}/${folder}/${String(sizeIndex + 1).padStart(2, '0')}_${sizeName}/${stem}-transparent-${project.baseSize * scale}.${format}`, kind: format, assetId: asset.id, variant, scale })
          })
        } else if (format === 'jpg') {
          const dark = variant === 'white' || (variant === 'original' && asset.role === 'primary-dark')
          files.push({ path: `${base}/${folder}/${stem}-${dark ? 'black' : 'white'}-bg.jpg`, kind: format, assetId: asset.id, variant, scale: 1 })
        } else files.push({ path: `${base}/${folder}/${stem}.${format}`, kind: format, assetId: asset.id, variant })
      }
    }
  })
  if (project.includeIcons) {
    const assetId = getIconAsset(project).id
    const folders = getIconFolders(project)
    files.push(
      { path: `${folders.favicon}/favicon.svg`, kind: 'svg', assetId },
      { path: `${folders.favicon}/favicon.ico`, kind: 'ico', assetId },
      { path: `${folders.favicon}/favicon-96.png`, kind: 'png', assetId, iconSize: 96, padding: 0.025 },
      { path: `${folders.favicon}/setup.html`, kind: 'setup' },
      { path: `${folders.app}/apple-touch-icon.png`, kind: 'png', assetId, iconSize: 180, padding: 0.2, background: project.jpgBackground },
      ...[192, 512, 1024].map(size => ({ path: `${folders.app}/icon-${size}.png`, kind: 'png' as const, assetId, iconSize: size, padding: 0.2, background: project.jpgBackground })),
      { path: `${folders.app}/site.webmanifest`, kind: 'manifest' },
      { path: `${folders.app}/Icon_Composer/foreground.svg`, kind: 'svg', assetId, iconSize: 1024, padding: 0.2 },
      { path: `${folders.app}/Icon_Composer/foreground.png`, kind: 'png', assetId, iconSize: 1024, padding: 0.2 },
      { path: `${folders.app}/Icon_Composer/background.png`, kind: 'background', iconSize: 1024, background: project.jpgBackground },
      { path: `${folders.app}/Icon_Composer/README.txt`, kind: 'icon-notes' },
      { path: `${folders.avatar}/avatar-1024.png`, kind: 'png', assetId, iconSize: 1024, padding: 0.25, background: project.jpgBackground },
    )
  }
  if (project.includeGuide) files.push({ path: `${slugify(project.name)}_Logo_Guide.pdf`, kind: 'guide' })
  files.push({ path: 'Color_palette.json', kind: 'colors' }, { path: 'README.txt', kind: 'notes' })
  return files
}

export function hexToRgb(hex: string) {
  return [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16)) as [number, number, number]
}

export function rgbToCmyk(r: number, g: number, b: number) {
  const k = 1 - Math.max(r, g, b) / 255
  if (k === 1) return [0, 0, 0, 100]
  return [(1 - r / 255 - k) / (1 - k), (1 - g / 255 - k) / (1 - k), (1 - b / 255 - k) / (1 - k), k].map(v => Math.round(v * 100))
}

export function svgDataUri(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
