import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createDemoProject, getAssetFolder, getFilePlan, getIconAsset, getProjectValidation, inferRole, roleOptions } from '../lib/bundle/model'
import { mergePalette, paletteFromPixels } from '../lib/bundle/palette'
import { getGuideContent } from '../lib/bundle/guide-content'

const pixels = (colors: number[][]) => colors.flatMap(([r, g, b, alpha = 255, count = 100]) => Array.from({ length: count }, () => [r, g, b, alpha]).flat())

test('all nine requested logo roles are available and map to distinct safe folders', () => {
  const project = createDemoProject()
  assert.equal(roleOptions.length, 9)
  const folders = roleOptions.map(option => getAssetFolder({ ...project.assets[0], role: option.value, customName: '../Partner / logo' }, 0))
  assert.equal(new Set(folders).size, 9)
  assert.ok(folders.every(folder => !folder.includes('..') && !folder.includes('/')))
})

test('custom roles require a name; duplicate names never overwrite files', () => {
  const project = createDemoProject()
  project.assets.forEach(asset => { asset.role = 'custom' })
  assert.match(getProjectValidation(project)!, /Name/)
  project.assets.forEach(asset => { asset.customName = 'Partner' })
  assert.equal(getProjectValidation(project), null)
  const plan = getFilePlan(project)
  assert.equal(new Set(plan.map(file => file.path)).size, plan.length)
  assert.ok(plan.some(file => file.path.startsWith('02_Partner/')))
})

test('role inference recognizes dark, vertical, symbol and app sources', () => {
  assert.equal(inferRole('brand-on-black.svg', 400, 100), 'primary-dark')
  assert.equal(inferRole('Logo Mark.svg', 100, 100), 'logomark')
  assert.equal(inferRole('app-icon.png', 512, 512), 'app-icon')
  assert.equal(inferRole('brand.svg', 100, 200), 'vertical')
})

test('archive follows role, color space, format and four size folders', () => {
  const project = createDemoProject()
  project.assets.splice(1, 0, { ...project.assets[0], id: 'dark', role: 'primary-dark' })
  project.formats.push('eps')
  const paths = getFilePlan(project).map(file => file.path)
  for (const prefix of ['01_Primary_Logo/01_RGB_Digital/01_SVG/', '02_Primary_Logo_Dark/02_CMYK_Print/02_PDF/', '03_Logo_Mark/02_CMYK_Print/01_EPS/', '04_Favicon/favicon.svg', '05_App_Icon/Icon_Composer/foreground.svg', '06_Avatar/avatar-1024.png']) assert.ok(paths.some(path => path.startsWith(prefix)), prefix)
  for (const [index, size] of [512, 1024, 2048, 4096].entries()) assert.ok(paths.some(path => path.includes(`/0${index + 1}_`) && path.endsWith(`transparent-${size}.png`)))
  assert.ok(paths.some(path => path.endsWith('primary-logo-dark-rgb-original-on-black-black-bg.jpg')))
})

test('raster PDF names disclose RGB and icon source respects explicit selection', () => {
  const project = createDemoProject()
  project.assets[0].sourceType = 'raster'
  assert.ok(getFilePlan(project).some(file => file.kind === 'pdf' && file.assetId === project.assets[0].id && file.path.includes('-rgb-')))
  project.assets[1].role = 'app-icon'
  project.iconAssetId = ''
  assert.equal(getIconAsset(project).id, project.assets[1].id)
  project.iconAssetId = project.assets[0].id
  assert.equal(getIconAsset(project).id, project.assets[0].id)
})

test('pixel palette preserves source colors and ignores transparency and anti-aliasing', () => {
  const palette = paletteFromPixels(pixels([[255, 106, 0, 255, 500], [0, 0, 0, 255, 300], [255, 255, 255, 255, 500], [100, 255, 0, 0, 5000], [254, 105, 0, 100, 1000]]))
  assert.equal(palette[0], '#FF6A00')
  assert.ok(palette.includes('#000000'))
  assert.ok(palette.includes('#FFFFFF'))
  assert.ok(!palette.includes('#64FF00'))
  assert.deepEqual(paletteFromPixels([255, 0, 0, 0]), [])
})

test('palette merges all logo sources, deduplicates close shades and limits to five', () => {
  assert.deepEqual(mergePalette(['#FF6A00', '#FE6901', '#000000', '#FFFFFF', '#1188EE', '#AA22BB', '#00FF00']), ['#FF6A00', '#000000', '#FFFFFF', '#1188EE', '#AA22BB'])
})

test('every supported guide language has the original seventeen-page sequence', () => {
  for (const language of ['it', 'en', 'es', 'fr', 'de'] as const) {
    const content = getGuideContent(language)
    assert.equal(content.titles.length, 17)
    assert.equal(content.wrong.length, 6)
    assert.ok(content.titles.every(Boolean))
  }
  assert.equal(getGuideContent('en').titles[1], 'Your logo package')
  assert.equal(getGuideContent('en').titles[15], 'Apparel')
})
