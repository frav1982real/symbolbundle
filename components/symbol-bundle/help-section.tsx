import Link from 'next/link'
import { ArrowDownToLine, ArrowRight, ArrowUpFromLine, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { buttonVariants } from '@/components/ui/button'
import { BundleReveal } from './bundle-reveal'

export function HelpSection() {
  return <section aria-labelledby="how-it-works-heading" className="flex flex-col gap-12 sm:gap-16 lg:gap-24">
    <div className="home-hero grid items-center gap-6 sm:grid-cols-[1fr_1.08fr] sm:gap-8 lg:gap-16">
      <div data-studio-intro className="flex flex-col items-start gap-5">
        <h1 id="how-it-works-heading" className="home-headline text-balance font-serif font-medium">You designed the logo.<br /><span className="text-foreground">We handle the rest.</span></h1>
        <p className="max-w-md text-pretty text-base leading-relaxed text-muted-foreground lg:text-lg">One logo in. A complete handoff out. Every format, your colors, and a brand guide. Beautifully bundled.</p>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/generate" data-slot="button" className={buttonVariants({ size: 'lg' })}>Generate your bundle<ArrowRight data-icon="inline-end" aria-hidden="true" /></Link>
          <span className="text-sm text-muted-foreground">Free. No account.</span>
        </div>
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="size-4 shrink-0" aria-hidden="true" />Your files stay in your browser.</p>
      </div>
      <BundleReveal />
    </div>
    <section id="howitworks" aria-labelledby="workflow-heading" className="flex flex-col gap-8">
      <h2 id="workflow-heading" className="text-3xl font-medium tracking-tight">From your design to their toolkit.</h2>
      <div className="grid gap-8 md:grid-cols-3">{[
      { icon: ArrowUpFromLine, number: '01', title: 'Bring your logo.', body: 'Upload SVG files and assign each version a role: primary, symbol, wordmark, or a custom name. Colors are extracted automatically.' },
      { icon: SlidersHorizontal, number: '02', title: 'Make it yours.', body: 'Choose formats, sizes, and a palette. Add favicons and a PDF guide in your client’s language.' },
      { icon: ArrowDownToLine, number: '03', title: 'Deliver with care.', body: 'Download a ZIP with clear names and organized folders. Ready for your client or team.' },
    ].map(item => <article key={item.number} className="flex flex-col gap-4"><div className="flex items-center justify-between border-b border-border pb-4"><item.icon className="size-5 text-primary" /><span className="font-mono text-sm text-muted-foreground">{item.number}</span></div><h3 className="text-xl font-medium tracking-tight">{item.title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p></article>)}</div>
    </section>
    <div className="grid gap-6 border-t border-border pt-10 md:grid-cols-[1fr_1.5fr]"><div className="flex flex-col gap-3"><h2 className="text-2xl font-medium tracking-tight">A few things before you start.</h2><p className="text-sm leading-relaxed text-muted-foreground">No hidden catches. Just helpful answers.</p></div><Accordion>
      <AccordionItem value="free"><AccordionTrigger>Is everything really free?</AccordionTrigger><AccordionContent><p className="leading-relaxed text-muted-foreground">Yes. All formats, variations, favicons, and the PDF guide are free. No Pro plan, subscription, account, or watermark. Each project supports up to 10 SVG logos, up to 1 MB each. Raster exports support up to 4096 px on the longest edge.</p></AccordionContent></AccordionItem>
      <AccordionItem value="privacy"><AccordionTrigger>Where are my logos stored?</AccordionTrigger><AccordionContent><p className="leading-relaxed text-muted-foreground">Logos are processed in your browser’s memory and are not sent to a server. Drafts are not saved: closing or reloading the page clears your project. Download your package before leaving.</p></AccordionContent></AccordionItem>
      <AccordionItem value="svg"><AccordionTrigger>How should I prepare my SVG files?</AccordionTrigger><AccordionContent><p className="leading-relaxed text-muted-foreground">Export self-contained SVG files with a viewBox and convert text to outlines to preserve typography. For security, scripts, embedded images, and external resources are removed. Standard gradients and vector shapes are supported; always check the preview.</p></AccordionContent></AccordionItem>
      <AccordionItem value="print"><AccordionTrigger>Are the files print-ready?</AccordionTrigger><AccordionContent><p className="leading-relaxed text-muted-foreground">PDFs from flat-color SVGs use mathematical CMYK conversion without an ICC profile. PDFs with gradients or images remain RGB, as indicated in the filename. Optional EPS files contain a raster CMYK image at 1200 px on the longest edge: they are not vector files and have no ICC profile. Palette CMYK values are approximate. For professional printing, agree on the profile and specifications with your printer.</p></AccordionContent></AccordionItem>
      <AccordionItem value="create"><AccordionTrigger>Does SymbolBundle design my logo?</AccordionTrigger><AccordionContent><p className="leading-relaxed text-muted-foreground">No: the design is yours. SymbolBundle helps prepare and organize delivery from an existing logo. Only SVG uploads are accepted. PNG, JPG, and WebP are generated as export formats. The Forma brand is only a sample for trying the generator.</p></AccordionContent></AccordionItem>
    </Accordion></div>
  </section>
}
