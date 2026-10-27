import { type LogoAsset } from './model'
import { readSvgFile } from './svg'

export async function readLogoFile(file: File): Promise<LogoAsset> {
  return readSvgFile(file)
}
