import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Le anteprime mostrano loghi caricati dall'utente (blob/data URL) e next/image è comunque `unoptimized`.
      '@next/next/no-img-element': 'off',
      // Pattern di idratazione/mount usati di proposito: da rivedere, ma non bloccanti.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  globalIgnores(['.next/**', '.open-next/**', 'out/**', 'build/**', 'public/**', 'next-env.d.ts']),
])
