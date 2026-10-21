import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createDemoProject, createEmptyProject, getFilePlan, getProjectValidation, hexToRgb, rgbToCmyk, slugify } from '../lib/bundle/model'
import { fitDimensions } from '../lib/bundle/raster'

test('a new project has no demo assets, name or planned files', () => {
  const project = createEmptyProject()
  assert.equal(project.name, '')
  assert.deepEqual(project.assets, [])
  assert.equal(project.iconAssetId, '')
  assert.deepEqual(getFilePlan(project), [])
  assert.equal(getProjectValidation(project), 'Upload at least one logo.')
  project.colors.push('#FFFFFF')
  assert.equal(createEmptyProject().colors.length, 1)
})

test('the optional demo remains valid and produces 83 unique file paths', () => {
  const project = createDemoProject()
  assert.equal(getProjectValidation(project), null)
  const files = getFilePlan(project)
  assert.equal(files.length, 83)
  assert.equal(new Set(files.map(file => file.path)).size, files.length)
  assert.equal(files.filter(file => file.kind === 'guide').length, 1)
  assert.equal(files.filter(file => file.iconSize).length, 9)
})

test('all formats, variants and scales are planned independently', () => {
  const project = createDemoProject()
  project.formats = ['svg', 'png', 'jpg', 'webp', 'pdf', 'eps']
  project.scales = [1, 2, 3]
  const files = getFilePlan(project)
  assert.equal(files.length, 77)
  for (const asset of project.assets) for (const variant of project.variants) {
    assert.equal(files.filter(file => file.assetId === asset.id && file.variant === variant).length, 10)
  }
  project.includeGuide = false
  project.includeIcons = false
  assert.equal(getFilePlan(project).length, 62)
})

test('same-named assets have collision-free folders and safe filenames', () => {
  const project = createDemoProject()
  project.assets[1].name = project.assets[0].name = '../../Bèllò.svg'
  project.name = '../Bränd / test'
  const files = getFilePlan(project)
  assert.equal(new Set(files.map(file => file.path)).size, files.length)
  assert.ok(files.every(file => !file.path.includes('..')))
  assert.equal(slugify('.. / àé brand'), 'ae_brand')
})

test('raster settings reject empty, non-finite, fractional and excessive dimensions', () => {
  for (const size of [NaN, Infinity, 0, -5, 63, 64.5, 2049]) {
    const project = createDemoProject()
    project.baseSize = size
    assert.notEqual(getProjectValidation(project), null, String(size))
  }
  const project = createDemoProject()
  project.baseSize = 2048
  project.scales = [1, 2]
  assert.equal(getProjectValidation(project), null)
  project.scales = [3]
  assert.notEqual(getProjectValidation(project), null)
  for (const scales of [[], [0], [-1], [1.5], [5], [NaN]]) {
    project.scales = scales
    assert.notEqual(getProjectValidation(project), null)
  }
})

test('vector-only exports do not require raster settings', () => {
  const project = createDemoProject()
  project.formats = ['svg', 'pdf', 'eps']
  project.scales = []
  project.baseSize = NaN
  assert.equal(getProjectValidation(project), null)
  assert.ok(getFilePlan(project).every(file => file.scale === undefined))
})

test('required name, formats, variants and valid palette are checked', () => {
  for (const patch of [{ name: '  ' }, { formats: [] }, { variants: [] }, { colors: [] }, { colors: ['bad'] }, { jpgBackground: '#fff' }]) {
    assert.notEqual(getProjectValidation({ ...createDemoProject(), ...patch }), null)
  }
})

test('icon source falls back when a selected logo was removed', () => {
  const project = createDemoProject()
  project.iconAssetId = 'removed'
  assert.ok(getFilePlan(project).filter(file => file.assetId && (file.iconSize || file.kind === 'ico')).every(file => file.assetId === project.assets[1].id))
  project.assets = project.assets.slice(0, 1)
  assert.ok(getFilePlan(project).filter(file => file.assetId && file.iconSize).every(file => file.assetId === project.assets[0].id))
})

test('color conversion handles black, white and primary colors', () => {
  assert.deepEqual(hexToRgb('#F38B60'), [243, 139, 96])
  assert.deepEqual(rgbToCmyk(0, 0, 0), [0, 0, 0, 100])
  assert.deepEqual(rgbToCmyk(255, 255, 255), [0, 0, 0, 0])
  assert.deepEqual(rgbToCmyk(255, 0, 0), [0, 100, 100, 0])
})

test('raster dimensions maintain landscape, portrait and small aspect ratios', () => {
  assert.deepEqual(fitDimensions(200, 100, 800), { width: 800, height: 400 })
  assert.deepEqual(fitDimensions(100, 200, 800), { width: 400, height: 800 })
  assert.deepEqual(fitDimensions(100, 1, 64), { width: 64, height: 1 })
})
