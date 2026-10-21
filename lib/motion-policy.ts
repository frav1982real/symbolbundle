export type MotionPreference = 'auto' | 'on' | 'off'

export interface MotionCapabilities {
  reducedMotion: boolean
  saveData?: boolean
  deviceMemory?: number
  hardwareConcurrency?: number
}

export function parseMotionPreference(value?: string): MotionPreference {
  return value === 'on' || value === 'off' ? value : 'auto'
}

export function getMotionPolicy(preference: MotionPreference, capabilities: MotionCapabilities) {
  if (capabilities.reducedMotion) return { enabled: false, reason: 'system' as const }
  if (preference === 'off') return { enabled: false, reason: 'manual' as const }

  const limitedDevice = capabilities.saveData ||
    (capabilities.deviceMemory !== undefined && capabilities.deviceMemory <= 4) ||
    (capabilities.hardwareConcurrency !== undefined && capabilities.hardwareConcurrency <= 4)

  if (preference === 'auto' && limitedDevice) return { enabled: false, reason: 'device' as const }
  return { enabled: true, reason: 'full' as const }
}
