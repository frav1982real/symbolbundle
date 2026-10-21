import { type BundleProject, type GuideLanguage, type LogoAsset, getFilePlan } from './model'

const labels = {
  it: { proposal: 'Proposta da approvare', measure: 'Esempio: logo largo 100 mm, margine 10 mm per lato.', source: 'Sorgente', included: 'Incluso nel pacchetto', excluded: 'Non incluso nel pacchetto', files: 'file', noAdditional: 'Nessun logo aggiuntivo', generated: 'Generata automaticamente', variants: ['Originale', 'Nero', 'Bianco'], check: 'Prima della consegna', steps: ['Controlla i loghi su sfondi chiari e scuri.', 'Verifica nomi, ruoli, palette e dimensioni.', 'Approva le regole proposte con il responsabile del brand.', 'Concorda profilo ICC e specifiche con la tipografia.'] },
  en: { proposal: 'Proposal for approval', measure: 'Example: 100 mm logo width, 10 mm clear space on each side.', source: 'Source', included: 'Included in the package', excluded: 'Not included in the package', files: 'files', noAdditional: 'No additional logos', generated: 'Automatically generated', variants: ['Original', 'Black', 'White'], check: 'Before delivery', steps: ['Check logos on light and dark backgrounds.', 'Verify names, roles, palette and dimensions.', 'Approve proposed rules with the brand owner.', 'Agree ICC profile and specifications with the printer.'] },
  es: { proposal: 'Propuesta pendiente de aprobación', measure: 'Ejemplo: logotipo de 100 mm, margen de 10 mm por lado.', source: 'Fuente', included: 'Incluido en el paquete', excluded: 'No incluido en el paquete', files: 'archivos', noAdditional: 'Sin logotipos adicionales', generated: 'Generada automáticamente', variants: ['Original', 'Negro', 'Blanco'], check: 'Antes de entregar', steps: ['Comprueba los logotipos sobre fondos claros y oscuros.', 'Verifica nombres, versiones, colores y tamaños.', 'Aprueba las reglas propuestas con el responsable de marca.', 'Acuerda perfil ICC y especificaciones con la imprenta.'] },
  fr: { proposal: 'Proposition à approuver', measure: 'Exemple : logo de 100 mm, marge de 10 mm de chaque côté.', source: 'Source', included: 'Inclus dans le pack', excluded: 'Non inclus dans le pack', files: 'fichiers', noAdditional: 'Aucun logo supplémentaire', generated: 'Généré automatiquement', variants: ['Original', 'Noir', 'Blanc'], check: 'Avant livraison', steps: ['Vérifiez les logos sur fonds clairs et sombres.', 'Vérifiez noms, versions, couleurs et dimensions.', 'Faites approuver les règles par le responsable de marque.', 'Validez le profil ICC et les spécifications avec l’imprimeur.'] },
  de: { proposal: 'Vorschlag zur Freigabe', measure: 'Beispiel: Logo 100 mm breit, Schutzraum 10 mm je Seite.', source: 'Quelle', included: 'Im Paket enthalten', excluded: 'Nicht im Paket enthalten', files: 'Dateien', noAdditional: 'Keine weiteren Logos', generated: 'Automatisch erstellt', variants: ['Original', 'Schwarz', 'Weiß'], check: 'Vor der Übergabe', steps: ['Logos auf hellen und dunklen Hintergründen prüfen.', 'Namen, Versionen, Farben und Größen prüfen.', 'Vorgeschlagene Regeln vom Markeninhaber freigeben lassen.', 'ICC-Profil und Druckvorgaben mit der Druckerei abstimmen.'] },
}

export function getGuideLabels(language: GuideLanguage) { return labels[language] }

export function getGuidePrimary(project: BundleProject): LogoAsset | undefined {
  return project.assets.find(asset => asset.role === 'primary') || project.assets.find(asset => asset.role !== 'primary-dark') || project.assets[0]
}

export function getGuidePackageRows(project: BundleProject) {
  const groups = new Map<string, number>()
  for (const file of getFilePlan(project)) {
    const root = file.path.split('/')[0]
    groups.set(root, (groups.get(root) || 0) + 1)
  }
  return [...groups].map(([name, count]) => ({ name, count }))
}

export function getGuideRasterSizes(project: BundleProject) {
  if (!project.formats.some(format => format === 'png' || format === 'webp')) return []
  return [...new Set(project.scales)].sort((a, b) => a - b).map(scale => project.baseSize * scale)
}
