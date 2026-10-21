import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createDemoProject, getFilePlan } from '../lib/bundle/model'
import { getGuideContent } from '../lib/bundle/guide-content'
import { getGuideLabels, getGuidePackageRows, getGuidePrimary, getGuideRasterSizes } from '../lib/bundle/guide-data'

test('guide inventory exactly matches the archive, including disabled options', () => {
  for (const includeGuide of [true, false]) for (const includeIcons of [true, false]) {
    const project = { ...createDemoProject(), includeGuide, includeIcons }
    const rows = getGuidePackageRows(project)
    const files = getFilePlan(project)
    assert.equal(rows.reduce((sum, row) => sum + row.count, 0), files.length)
    for (const row of rows) assert.equal(row.count, files.filter(file => file.path.split('/')[0] === row.name).length)
    assert.equal(rows.some(row => row.name.endsWith('_Logo_Guide.pdf')), includeGuide)
    assert.equal(rows.some(row => row.name.includes('Favicon')), includeIcons)
  }
})

test('guide primary selection preserves the supplied dark original as fallback', () => {
  const project = createDemoProject()
  const dark = { ...project.assets[0], id: 'dark', role: 'primary-dark' as const }
  project.assets = [dark, project.assets[1], project.assets[0]]
  assert.equal(getGuidePrimary(project)?.role, 'primary')
  project.assets = [dark]
  assert.equal(getGuidePrimary(project)?.id, 'dark')
  project.assets = []
  assert.equal(getGuidePrimary(project), undefined)
})

test('guide reports exact raster sizes, not assumed defaults', () => {
  const project = createDemoProject()
  project.baseSize = 256
  project.scales = [4, 1, 2, 1]
  assert.deepEqual(getGuideRasterSizes(project), [256, 512, 1024])
  project.formats = ['svg', 'pdf']
  assert.deepEqual(getGuideRasterSizes(project), [])
})

test('all guide languages label proposals and have seventeen sections', () => {
  for (const language of ['it', 'en', 'es', 'fr', 'de'] as const) {
    const labels = getGuideLabels(language)
    assert.ok(labels.proposal)
    assert.equal(labels.variants.length, 3)
    assert.equal(labels.steps.length, 4)
    assert.equal(getGuideContent(language).titles.length, 17)
  }
  assert.match(getGuideContent('it').clear, /non una regola ufficiale/)
  assert.match(getGuideContent('en').clear, /not an official/)
})
