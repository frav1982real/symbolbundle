import type { jsPDF } from 'jspdf'

export function drawApplication(doc: jsPDF, type: number, x: number, y: number, dark: boolean): { x: number; y: number; width: number; height: number } {
  const ink = '#292C30', paper = '#FFFFFF', line = '#DDDEDF'
  const fill = dark ? ink : paper
  doc.setDrawColor(dark ? ink : line)
  doc.setFillColor(fill)
  doc.setLineWidth(0.25)
  if (type === 0) {
    doc.roundedRect(x + 36, y, 30, 36, 11, 11, 'FD')
    doc.setFillColor(paper)
    doc.roundedRect(x + 41, y + 5, 20, 30, 7, 7, 'F')
    doc.setFillColor(fill)
    doc.roundedRect(x + 19, y + 23, 64, 57, 4, 4, 'FD')
    return { x: x + 29, y: y + 43, width: 44, height: 17 }
  }
  if (type === 1) {
    doc.roundedRect(x + 66, y + 26, 20, 31, 8, 8, 'FD')
    doc.setFillColor(paper)
    doc.roundedRect(x + 71, y + 31, 10, 21, 4, 4, 'F')
    doc.setFillColor(fill)
    doc.roundedRect(x + 22, y + 15, 48, 58, 5, 5, 'FD')
    doc.setDrawColor(dark ? '#707378' : line)
    doc.ellipse(x + 46, y + 18, 23, 4, 'D')
    return { x: x + 29, y: y + 36, width: 34, height: 15 }
  }
  if (type === 2) {
    doc.roundedRect(x + 4, y + 20, 94, 53, 1.5, 1.5, 'FD')
    return { x: x + 23, y: y + 37, width: 56, height: 19 }
  }
  if (type === 3) {
    doc.roundedRect(x + 18, y + 1, 66, 83, 1.5, 1.5, 'FD')
    doc.setDrawColor(dark ? '#707378' : line)
    doc.line(x + 18, y + 64, x + 84, y + 64)
    return { x: x + 29, y: y + 32, width: 44, height: 17 }
  }
  doc.lines([[21, -12], [12, 7], [12, -7], [21, 12], [14, 25], [-15, 9], [-8, -13], [0, 55], [-48, 0], [0, -55], [-8, 13], [-15, -9], [14, -25]], x + 18, y + 12, [1, 1], 'FD', true)
  return { x: x + 33, y: y + 32, width: 36, height: 16 }
}
