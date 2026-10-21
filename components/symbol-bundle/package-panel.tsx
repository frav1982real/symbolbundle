'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Download, FileCode2, FileImage, FileJson, FileText, Folder, FolderArchive, Loader2, PackageCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type BundleProject, type PlannedFile, slugify } from '@/lib/bundle/model'
import { cn } from '@/lib/utils'

interface TreeNode { name: string; path: string; children: TreeNode[]; file?: PlannedFile; count: number }
function makeTree(files: PlannedFile[]) {
  const root: TreeNode = { name: '', path: '', children: [], count: files.length }
  for (const file of files) {
    let current = root
    file.path.split('/').forEach((part, index, parts) => {
      const path = parts.slice(0, index + 1).join('/')
      let node = current.children.find(item => item.name === part)
      if (!node) { node = { name: part, path, children: [], count: 0 }; current.children.push(node) }
      node.count++
      if (index === parts.length - 1) node.file = file
      current = node
    })
  }
  return root.children
}

function TreeItem({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [open, setOpen] = useState(depth === 0 && node.name.startsWith('01_'))
  const Icon = node.file ? node.file.kind === 'colors' || node.file.kind === 'manifest' ? FileJson : node.file.kind === 'svg' ? FileCode2 : node.file.kind === 'guide' || node.file.kind === 'notes' || node.file.kind === 'pdf' ? FileText : FileImage : Folder
  return <li className="min-w-0">
    {node.file ? <div title={node.name} className="flex min-w-0 items-center gap-2 py-1.5 text-sm text-muted-foreground"><Icon className="size-4 shrink-0" /><span className="truncate">{node.name}</span></div> : <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full min-w-0 items-center gap-2 rounded py-2 text-left text-sm hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">{open ? <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />}<Icon className={cn('size-4 shrink-0', depth === 0 ? 'text-primary/80' : 'text-muted-foreground')} /><span className="truncate" title={node.name}>{node.name.replace(/^\d+_/, '').replaceAll('_', ' ')}</span><span className="ml-auto font-mono text-sm text-muted-foreground">{node.count}</span></button>}
    {open && !node.file && <ul className="ml-2 flex flex-col border-l border-border pl-4">{node.children.map(child => <TreeItem key={child.path} node={child} depth={depth + 1} />)}</ul>}
  </li>
}

export function PackagePanel({ project, files, busy, uploading, progress, onDownload, validationError, finished }: { project: BundleProject; files: PlannedFile[]; busy: boolean; uploading: boolean; progress: { completed: number; total: number; filename: string }; onDownload: () => void; validationError: string | null; finished: boolean }) {
  const tree = useMemo(() => makeTree(files), [files])
  const percentage = progress.total ? Math.round(progress.completed / progress.total * 100) : 0
  return <aside aria-label="Summary and download" className="flex min-w-0 flex-col border-t border-border bg-card text-card-foreground">
    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
      <div className="flex min-w-0 items-center gap-3"><FolderArchive className="size-5 shrink-0 text-muted-foreground" /><div className="flex min-w-0 flex-col gap-1"><h2 className="truncate text-sm font-medium" title={project.assets.length ? `${slugify(project.name)}_Logo_Asset_Pack.zip` : undefined}>{project.assets.length ? `${slugify(project.name)}_Logo_Asset_Pack.zip` : 'Your package, ready when you are'}</h2><p className="text-sm text-muted-foreground" role="status">{validationError || `${files.length} file · ${project.formats.length} formats${project.includeGuide ? ' · PDF guide included' : ''}`}</p></div></div>
      <Button size="lg" data-motion-success={finished || undefined} disabled={busy || uploading || !!validationError} onClick={onDownload} className="shrink-0">{busy || uploading ? <Loader2 className="animate-spin" data-icon="inline-start" /> : finished ? <PackageCheck data-icon="inline-start" /> : <Download data-icon="inline-start" />}{uploading ? 'Analyzing files…' : busy ? `Generating ${percentage}%` : finished ? 'Download again' : 'Download ZIP'}</Button>
    </div>
    {busy && <div className="flex min-w-0 flex-col gap-2 px-5 pb-5 sm:px-7" role="status" aria-live="polite"><div role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100} aria-label="Generating package" className="h-1 overflow-hidden rounded-full bg-muted"><div className="h-full origin-left bg-primary" style={{ transform: `scaleX(${percentage / 100})` }} /></div><span className="truncate text-sm text-muted-foreground">{progress.filename}</span></div>}
    {!!files.length && <details className="border-t border-border"><summary className="cursor-pointer px-5 py-3 text-sm text-muted-foreground sm:px-7">ZIP contents · {files.length} file</summary><ul className="flex max-h-80 min-w-0 flex-col gap-1 overflow-y-auto px-5 pb-5 sm:px-7" aria-label="Package files and folders">{tree.map(node => <TreeItem key={node.path} node={node} />)}</ul></details>}
  </aside>
}
