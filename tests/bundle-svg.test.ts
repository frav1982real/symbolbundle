import assert from 'node:assert/strict'
import { before, test } from 'node:test'
import { JSDOM } from 'jsdom'

let readSvgFile: typeof import('../lib/bundle/svg').readSvgFile
let recolorSvg: typeof import('../lib/bundle/svg').recolorSvg
let extractColors: typeof import('../lib/bundle/svg').extractColors
const svg = (content: string, dimensions = 'viewBox="0 0 200 100"') => `<svg xmlns="http://www.w3.org/2000/svg" ${dimensions}>${content}</svg>`
const file = (source: string, name = 'logo.svg') => new File([source], name, { type: 'image/svg+xml' })

before(async () => {
  const { window } = new JSDOM('')
  Object.assign(globalThis, { window, document: window.document, DOMParser: window.DOMParser, XMLSerializer: window.XMLSerializer })
  const helpers = await import('../lib/bundle/svg')
  ;({ readSvgFile, recolorSvg, extractColors } = helpers)
})

test('valid SVGs receive canonical dimensions and unique IDs', async () => {
  const a = await readSvgFile(file(svg('<path d="M0 0h100v50z" fill="#abc"/>')))
  const b = await readSvgFile(file(svg('<circle r="20"/>')))
  assert.equal(a.width, 200)
  assert.equal(a.height, 100)
  assert.notEqual(a.id, b.id)
  assert.match(a.svg, /width="200"/)
  assert.deepEqual(extractColors(a.svg), ['#AABBCC'])
})

test('the shared upload reader accepts only SVGs and validates their contents', async () => {
  const { readLogoFile } = await import('../lib/bundle/assets')
  const asset = await readLogoFile(file(svg('<rect width="50" height="50" fill="#123456"/>'), 'brand.SVG'))
  assert.equal(asset.sourceType, undefined)
  assert.deepEqual(extractColors(asset.svg), ['#123456'])
  for (const name of ['logo.png', 'logo.jpg', 'logo.jpeg', 'logo.webp', 'logo.gif', 'logo.svg.png']) {
    await assert.rejects(readLogoFile(file(svg(''), name)), /upload an SVG file/)
  }
  await assert.rejects(readLogoFile(file('not an SVG', 'fake.svg')), /invalid SVG/)
})

test('physical SVG dimensions are converted consistently to CSS pixels', async () => {
  const asset = await readSvgFile(file(svg('', 'width="1in" height="72pt"')))
  assert.equal(asset.width, 96)
  assert.equal(asset.height, 96)
  await assert.rejects(readSvgFile(file(svg('', 'width="100%" height="100%"'))))
})

test('invalid extension, empty content, malformed XML and doctypes are rejected', async () => {
  await assert.rejects(readSvgFile(file(svg(''), 'test.png')))
  for (const source of ['', '<html/>', '<svg viewBox="0 0 20 20"><path></svg>', '<!DOCTYPE svg><svg/>', '<!ENTITY x "test"><svg/>']) {
    await assert.rejects(readSvgFile(file(source)), source)
  }
})

test('oversized, overly complex and invalid aspect SVGs are rejected', async () => {
  await assert.rejects(readSvgFile(file(' '.repeat(1024 * 1024 + 1))))
  await assert.rejects(readSvgFile(file(svg('<g/>'.repeat(5001)))))
  for (const dimensions of ['viewBox="0 0 0 20"', 'viewBox="0 0 -1 20"', 'viewBox="0 0 1000 1"', 'viewBox="0 0 x 20"', 'viewBox="0 0 20"', 'width="0" height="20"']) {
    await assert.rejects(readSvgFile(file(svg('', dimensions))), dimensions)
  }
})

test('active SVG content, external URLs and unsafe CSS are removed', async () => {
  const source = svg('<script>alert(1)</script><foreignObject><p>HTML</p></foreignObject><image href="https://example.com/x"/><style>@import "https://example.com/x.css";</style><path onclick="alert(1)" fill="url(https://example.com/x)" d="M0 0h20v20z"/><use href="https://example.com/x.svg#x"/>')
  const asset = await readSvgFile(file(source))
  assert.doesNotMatch(asset.svg, /script|foreignObject|onclick|https:\/\/example|@import/)
})

test('quoted and unquoted internal gradient and use references survive sanitization', async () => {
  for (const paint of ['url(#gradient)', "url('#gradient')", 'url(&quot;#gradient&quot;)']) {
    const asset = await readSvgFile(file(svg(`<defs><linearGradient id="gradient"><stop stop-color="#ff0000"/></linearGradient><path id="shape" d="M0 0h10v10z"/></defs><path fill="${paint}" d="M0 0h20v20z"/><use href="#shape"/>`)))
    assert.match(asset.svg, /fill="url\(/)
    assert.match(asset.svg, /href="#shape"/)
  }
})

test('monochrome variants preserve none, transparent, masks and stroke-only geometry', () => {
  const original = svg('<defs><mask id="m"><rect width="200" height="100" fill="#fff"/></mask></defs><path fill="none" stroke="#F38B60" d="M0 0h50"/><rect fill="transparent"/><circle fill="#abc"/>')
  assert.equal(recolorSvg(original, 'original'), original)
  const white = recolorSvg(original, 'white')
  assert.match(white, /fill="none" stroke="#FFFFFF"/)
  assert.match(white, /fill="transparent"/)
  assert.match(white, /<circle fill="#FFFFFF"/)
  assert.match(white, /<mask[^>]*><rect[^>]*fill="#fff"/)
  assert.match(recolorSvg(original, 'black'), /stroke="#000000"/)
})

test('CSS and inherited colors are recolored without introducing fill on open strokes', () => {
  const result = recolorSvg(svg('<style>.mark{fill:#abc;stroke:none}.line{fill:none;stroke:rgb(1,2,3)}</style><path class="line" d="M0 0h10"/><circle class="mark"/>'), 'white')
  assert.match(result, /fill:#FFFFFF;stroke:none/)
  assert.match(result, /fill:none;stroke:#FFFFFF/)
})

test('RGB, percentage RGB and transparent paints are handled', () => {
  assert.deepEqual(extractColors('fill:rgb(255,106,0);stroke:rgb(0%, 100%, 0%);color:rgba(12,34,56,0)'), ['#FF6A00', '#00FF00'])
})

test('embedded raster monochrome uses a filter without dropping the original image', () => {
  const result = recolorSvg(svg('<image href="data:image/png;base64,AAAA" width="200" height="100"/>'), 'white')
  assert.match(result, /feColorMatrix/)
  assert.match(result, /filter="url\(#symbolbundle-monochrome\)"/)
  assert.match(result, /data:image\/png;base64,AAAA/)
})

test('palette extraction deduplicates and limits colors', () => {
  assert.deepEqual(extractColors('#abc #aabbcc #123456 #000 #fff #ff0000 #00ff00'), ['#AABBCC', '#123456', '#000000', '#FFFFFF', '#FF0000'])
})
