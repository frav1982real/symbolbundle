import assert from 'node:assert/strict'
import { before, test } from 'node:test'
import { JSDOM } from 'jsdom'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createDemoProject, type BundleProject } from '../lib/bundle/model'
import { createGuide } from '../lib/bundle/guide'

before(() => {
  const { window } = new JSDOM('')
  Object.assign(globalThis, { window, document: window.document, DOMParser: window.DOMParser, XMLSerializer: window.XMLSerializer })
  // Browser checks cover artwork; this fixture isolates text and page geometry.
  window.HTMLCanvasElement.prototype.getContext = (() => ({ drawImage() {} })) as unknown as typeof window.HTMLCanvasElement.prototype.getContext
  window.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII='
  class TestImage {
    width = 100
    height = 100
    crossOrigin = ''
    onload?: () => void
    set src(_value: string) { queueMicrotask(() => this.onload?.()) }
  }
  Object.assign(globalThis, { Image: TestImage })
})

async function verifyPdf(project: BundleProject) {
  const blob = await createGuide(project)
  const pdf = await getDocument({ data: new Uint8Array(await blob.arrayBuffer()), useSystemFonts: true }).promise
  try {
    assert.equal(pdf.numPages, 17)
    const texts: string[] = []
    for (let number = 1; number <= pdf.numPages; number++) {
      const page = await pdf.getPage(number)
      const viewport = page.getViewport({ scale: 1 })
      assert.ok(Math.abs(viewport.width / viewport.height - 16 / 9) < .001)
      const content = await page.getTextContent()
      texts.push(content.items.filter(item => 'str' in item).map(item => item.str).join(' '))
      for (const item of content.items) {
        if (!('str' in item) || !item.str.trim()) continue
        const label = `page ${number}: ${item.str}`
        assert.ok(item.transform[4] >= 0 && item.transform[5] >= 0, label)
        assert.ok(item.transform[4] + item.width <= viewport.width + 1, label)
        assert.ok(item.transform[5] <= viewport.height, label)
      }
    }
    return texts
  } finally { await pdf.destroy() }
}

test('generated PDFs have seventeen bounded landscape pages in five languages', async () => {
  for (const guideLanguage of ['it', 'en', 'es', 'fr', 'de'] as const) {
    const texts = await verifyPdf({ ...createDemoProject(), guideLanguage })
    assert.match(texts[1], /01_Primary_Logo/)
    assert.match(texts[2], /CMYK/)
  }
})

test('PDF supports ten logos, long names, five colors and disabled guide/icons', async () => {
  const project = createDemoProject()
  project.name = 'Studio internazionale di comunicazione e identità visiva 2026'
  project.assets = Array.from({ length: 10 }, (_, index) => ({ ...project.assets[0], id: String(index), name: `${'Logo_personalizzato_'.repeat(3)}${index}.svg`, role: 'custom' as const, customName: `Versione del marchio per applicazione numero ${index}` }))
  project.colors = ['#FFFFFF', '#000000', '#123456', '#ABCDEF', '#F38B60']
  project.includeGuide = false
  project.includeIcons = false
  const texts = await verifyPdf(project)
  assert.ok(!texts[1].includes('_Logo_Guide.pdf'))
  assert.match(texts[9], /Not included/)
})
