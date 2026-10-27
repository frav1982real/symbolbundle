import type { Metadata } from 'next'
import { BundleWorkspace } from '@/components/symbol-bundle/workspace'

export const metadata: Metadata = {
  title: 'Logo package generator — SymbolBundle',
  description: 'Upload your SVG logos, review your palette, choose export formats, and download a ZIP with organized files and a brand guide. Free and processed in your browser.',
}

export default function GeneratePage() {
  return <BundleWorkspace key="empty-project" />
}
