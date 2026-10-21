import { type BundleProject, type LogoAsset, type LogoVariant, getIconAsset, hexToRgb, rgbToCmyk, slugify } from './model'
import { fitDimensions, renderSvg } from './raster'
import { recolorSvg } from './svg'
import { getGuideContent } from './guide-content'
import { getGuideLabels, getGuidePackageRows, getGuidePrimary, getGuideRasterSizes } from './guide-data'
import { drawApplication } from './guide-applications'

export async function createGuide(project: BundleProject): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const primary = getGuidePrimary(project)
  if (!primary) throw new Error('Add at least one logo to generate the guide.')
  const doc = new jsPDF({ unit: 'mm', format: [320, 180], orientation: 'landscape', compress: true })
  const t = getGuideContent(project.guideLanguage)
  const ui = getGuideLabels(project.guideLanguage)
  const dark = project.assets.find(asset => asset.role === 'primary-dark')
  const additional = project.assets.filter(asset => asset.id !== primary.id && asset.id !== dark?.id)
  const name = project.name.trim() || 'Brand'
  const ink = '#202124', paper = '#FFFFFF', muted = '#70747C', surface = '#F4F5F7', line = '#DDDFE2'
  const images = new Map<string, string>()
  doc.setProperties({ title: `${name} - ${t.titles[0]}`, author: name, subject: t.titles[16], creator: 'SymbolBundle' })

  function text(value: string, x: number, y: number, width: number, size = 11, bold = false, color = ink, height = 30) {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    const safe = value.replace(/[’‘]/g, "'").replace(/[–—]/g, '-').replace(/×/g, 'x').replace(/…/g, '...')
    let fontSize = size
    doc.setFontSize(fontSize)
    let lines: string[] = doc.splitTextToSize(safe, width)
    while (lines.length * fontSize * .3528 * 1.4 > height && fontSize > 8) {
      fontSize -= .5
      doc.setFontSize(fontSize)
      lines = doc.splitTextToSize(safe, width)
    }
    doc.setTextColor(color)
    doc.text(lines, x, y, { lineHeightFactor: 1.4 })
  }
  function page(index: number) {
    if (index) doc.addPage([320, 180], 'landscape')
    doc.setFillColor(paper)
    doc.rect(0, 0, 320, 180, 'F')
    text(name, 18, 14, 180, 9, true, ink, 5)
    text(t.titles[0], 206, 14, 96, 9, false, muted, 5)
    doc.setDrawColor(line)
    doc.setLineWidth(.2)
    doc.line(18, 20, 302, 20)
    doc.line(18, 161, 302, 161)
    text(ui.generated, 18, 169, 200, 8, false, muted, 6)
    text(`${String(index + 1).padStart(2, '0')} / 17`, 283, 169, 25, 8, false, muted, 6)
    if (index > 0 && index < 16) text(t.titles[index].replace(/ \/ /g, ' · '), 18, 37, 284, 23, true, ink, 16)
  }
  function panel(x: number, y: number, width: number, height: number, color = surface) {
    doc.setFillColor(color)
    doc.roundedRect(x, y, width, height, 2, 2, 'F')
  }
  function note(value: string, y = 148) { text(value, 18, y, 284, 9, false, muted, 11) }
  function side(value: string, extra?: string) {
    text(value, 18, 58, 78, 11, false, muted, 65)
    if (extra) text(extra, 18, 126, 78, 10, true, ink, 24)
  }
  async function logo(asset: LogoAsset, x: number, y: number, width: number, height: number, variant: LogoVariant = 'original', rotation = 0, stretch = false) {
    const key = `${asset.id}-${variant}`
    if (!images.has(key)) {
      const dimensions = fitDimensions(asset.width, asset.height, 1600)
      const canvas = await renderSvg(recolorSvg(asset.svg, variant), dimensions.width, dimensions.height)
      images.set(key, canvas.toDataURL('image/png'))
    }
    const ratio = Math.min(width / asset.width, height / asset.height)
    const w = stretch ? width : asset.width * ratio, h = stretch ? height : asset.height * ratio
    doc.addImage(images.get(key)!, 'PNG', x + (width - w) / 2, y + (height - h) / 2, w, h, key, 'FAST', rotation)
  }
  async function original(x: number, y: number, width: number, height: number) { await logo(primary!, x, y, width, height) }
  async function onDark(x: number, y: number, width: number, height: number) { await logo(dark || primary!, x, y, width, height, dark ? 'original' : 'white') }
  function source(asset: LogoAsset) { return `${ui.source}: ${asset.name}` }

  page(0)
  panel(18, 36, 284, 62, primary.role === 'primary-dark' ? ink : surface)
  await original(40, 48, 240, 38)
  text(t.titles[0], 18, 119, 284, 32, true, ink, 24)
  text(name, 18, 141, 284, 16, false, muted, 13)

  page(1)
  side(t.packageIntro, `${slugify(name)}_Logo_Asset_Pack.zip`)
  const rows = getGuidePackageRows(project)
  const rowHeight = Math.min(8, 92 / Math.max(1, rows.length))
  rows.forEach((row, index) => {
    const y = 55 + index * rowHeight
    text(row.name, 110, y, 156, 9, false, ink, rowHeight - 1)
    text(`${row.count} ${ui.files}`, 275, y, 27, 9, false, muted, rowHeight - 1)
    doc.setDrawColor(line)
    doc.line(110, y + 2.5, 302, y + 2.5)
  })
  note(`${project.formats.map(format => format.toUpperCase()).join(' / ')}${getGuideRasterSizes(project).length ? ` · PNG / WebP: ${getGuideRasterSizes(project).join(' / ')} px` : ''}`)

  page(2)
  const colors = project.colors.length ? project.colors : [ink]
  const colorWidth = (284 - (colors.length - 1) * 6) / colors.length
  colors.forEach((color, index) => {
    const x = 18 + index * (colorWidth + 6)
    panel(x, 52, colorWidth, 46, color)
    doc.setDrawColor(line)
    doc.roundedRect(x, 52, colorWidth, 46, 2, 2, 'D')
    text(color.toUpperCase(), x, 111, colorWidth, 14, true, ink, 10)
    const rgb = hexToRgb(color)
    text(`RGB  ${rgb.join(' / ')}`, x, 122, colorWidth, 10, false, muted, 9)
    text(`CMYK  ${rgbToCmyk(...rgb).map(value => `${value}%`).join(' / ')}`, x, 132, colorWidth, 9, false, muted, 11)
  })
  note(t.palette)

  page(3)
  side(t.original)
  panel(110, 52, 192, 85, primary.role === 'primary-dark' ? ink : surface)
  await original(128, 68, 156, 53)
  text(source(primary), 110, 146, 192, 9, false, muted, 11)

  page(4)
  side(t.clear, ui.proposal)
  panel(110, 52, 192, 88)
  const factor = Math.min(134 / primary.width, 52 / primary.height)
  const w = primary.width * factor, h = primary.height * factor, margin = w * .1
  const x = 206 - w / 2, y = 96 - h / 2
  if (primary.role === 'primary-dark') panel(x, y, w, h, ink)
  doc.setDrawColor(muted)
  doc.setLineDashPattern([1, 1], 0)
  doc.rect(x - margin, y - margin, w + margin * 2, h + margin * 2)
  doc.setLineDashPattern([], 0)
  await original(x, y, w, h)
  const dimensionY = y + h + margin + 3
  doc.line(x, dimensionY, x + w, dimensionY)
  doc.line(x, dimensionY - 1, x, dimensionY + 1)
  doc.line(x + w, dimensionY - 1, x + w, dimensionY + 1)
  doc.line(x - margin, y - margin - 3, x, y - margin - 3)
  doc.line(x - margin, y - margin - 4, x - margin, y - margin - 2)
  doc.line(x, y - margin - 4, x, y - margin - 2)
  text('0.1 X', x - margin, y - margin - 6, 35, 9, false, muted, 6)
  text('X', 204, dimensionY + 5, 15, 9, true, ink, 6)
  note(ui.measure)

  page(5)
  side(t.variants)
  const variantWidth = (192 - (project.variants.length - 1) * 5) / Math.max(1, project.variants.length)
  for (let index = 0; index < project.variants.length; index++) {
    const variant = project.variants[index]
    const x = 110 + index * (variantWidth + 5)
    panel(x, 52, variantWidth, 80, variant === 'white' || (variant === 'original' && primary.role === 'primary-dark') ? ink : surface)
    await logo(primary, x + 8, 68, variantWidth - 16, 48, variant)
    text(ui.variants[['original', 'black', 'white'].indexOf(variant)], x, 143, variantWidth, 11, true, ink, 10)
  }
  note(ui.included)

  page(6)
  side(t.background, dark ? source(dark) : `${ui.proposal}: ${t.derived}`)
  panel(110, 52, 93, 80)
  panel(209, 52, 93, 80, ink)
  await logo(primary, 120, 67, 73, 50, primary.role === 'primary-dark' ? 'black' : 'original')
  await onDark(219, 67, 73, 50)
  text(t.light, 110, 143, 93, 10, true)
  text(t.dark, 209, 143, 93, 10, true)

  page(7)
  for (let index = 0; index < 6; index++) {
    const x = 18 + index % 3 * 97, y = 51 + Math.floor(index / 3) * 48
    panel(x, y, 90, 29, index === 4 ? surface : primary.role === 'primary-dark' ? ink : surface)
    if (index === 2) {
      const altered = recolorSvg(primary.svg, 'black').replaceAll('#000000', '#70747C')
      await logo({ ...primary, id: `${primary.id}-altered`, svg: altered }, x + 18, y + 6, 54, 16)
    } else if (index === 3) {
      await logo(primary, x + 20, y + 8, 54, 16, 'black')
      await logo(primary, x + 18, y + 6, 54, 16)
    } else {
      await logo(primary, x + 18, y + 6, 54, 16, index === 4 ? 'white' : 'original', index === 1 ? 10 : 0, index === 0)
      if (index === 5) text(name, x + 29, y + 18, 45, 10, true)
    }
    text(`${index + 1}. ${t.wrong[index]}`, x, y + 36, 90, 10, true, ink, 11)
  }
  note(t.wrongNote)

  page(8)
  if (!additional.length) {
    side(t.noAdditional)
    panel(110, 52, 192, 87)
    text(ui.noAdditional, 130, 96, 155, 16, true, muted)
  } else {
    const columns = additional.length > 4 ? 3 : 2
    const rowCount = Math.ceil(additional.length / columns)
    const cellWidth = (284 - (columns - 1) * 6) / columns
    const cellHeight = Math.min(85, 96 / rowCount)
    for (let index = 0; index < additional.length; index++) {
      const asset = additional[index]
      const x = 18 + index % columns * (cellWidth + 6), y = 50 + Math.floor(index / columns) * cellHeight
      panel(x, y, cellWidth, cellHeight - 11, asset.role === 'primary-dark' ? ink : surface)
      await logo(asset, x + 7, y + 3, cellWidth - 14, cellHeight - 17)
      text(asset.customName || asset.name, x, y + cellHeight - 5, cellWidth, 9, true, ink, 8)
    }
  }
  note(t.additional)

  page(9)
  side(project.includeIcons ? t.icons : t.noIcons)
  if (project.includeIcons) {
    const icon = getIconAsset(project)
    const fills = [.95, .6, .5]
    for (let index = 0; index < 3; index++) {
      const x = 110 + index * 66
      panel(x, 62, 60, 60, index ? project.jpgBackground : surface)
      const inset = 60 * (1 - fills[index]) / 2
      await logo(icon, x + inset, 62 + inset, 60 * fills[index], 60 * fills[index])
      text(['Favicon', 'App icon', 'Avatar'][index], x, 134, 60, 11, true)
      text(['SVG / ICO / 96 px', '180 / 192 / 512 / 1024 px', '1024 x 1024 px'][index], x, 143, 60, 9, false, muted, 11)
    }
    note(source(icon), 154)
  } else {
    panel(110, 52, 192, 87)
    text(ui.excluded, 130, 96, 155, 16, true, muted)
  }

  page(10)
  text(t.titles[10], 18, 75, 284, 34, true, ink, 35)
  text(t.applications, 18, 104, 260, 15, false, muted, 18)
  text(ui.proposal, 18, 140, 284, 11, true, ink, 10)

  for (let type = 0; type < 5; type++) {
    page(11 + type)
    side(t.applicationNote, ui.proposal)
    panel(110, 49, 192, 101)
    for (let index = 0; index < 2; index++) {
      const x = 108 + index * 96
      const box = drawApplication(doc, type, x, 55, index === 1)
      if (index === 1) await onDark(box.x, box.y, box.width, box.height)
      else await logo(primary, box.x, box.y, box.width, box.height, primary.role === 'primary-dark' ? 'black' : 'original')
      text(index === 0 ? t.light : t.dark, x + 12, 144, 80, 9, false, muted, 8)
    }
  }

  page(16)
  text(ui.check, 18, 44, 284, 27, true, ink, 20)
  ui.steps.forEach((step, index) => {
    const y = 65 + index * 16
    text(String(index + 1).padStart(2, '0'), 18, y, 14, 11, true, muted, 10)
    text(step, 37, y, 260, 12, false, ink, 13)
  })
  text(t.note, 18, 132, 284, 10, false, muted, 13)
  if (project.assets.some(asset => asset.sourceType)) text(t.raster, 18, 147, 284, 10, false, muted, 11)
  return doc.output('blob')
}
