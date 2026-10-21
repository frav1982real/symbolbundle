import test from 'node:test'
import assert from 'node:assert/strict'
import { getMotionPolicy, parseMotionPreference } from '../lib/motion-policy'

const capableDevice = { reducedMotion: false, deviceMemory: 8, hardwareConcurrency: 8 }

test('animations run automatically on a capable device and with unknown hardware', () => {
  assert.equal(getMotionPolicy('auto', capableDevice).enabled, true)
  assert.equal(getMotionPolicy('auto', { reducedMotion: false }).enabled, true)
})

test('automatic mode conserves resources on limited devices and data saver', () => {
  for (const limited of [{ deviceMemory: 4 }, { hardwareConcurrency: 2 }, { saveData: true }]) {
    assert.deepEqual(getMotionPolicy('auto', { ...capableDevice, ...limited }), { enabled: false, reason: 'device' })
  }
})

test('manual choice is respected without overriding system reduced motion', () => {
  assert.deepEqual(getMotionPolicy('off', capableDevice), { enabled: false, reason: 'manual' })
  assert.equal(getMotionPolicy('on', { ...capableDevice, deviceMemory: 2 }).enabled, true)
  for (const preference of ['auto', 'on', 'off'] as const) {
    assert.deepEqual(getMotionPolicy(preference, { ...capableDevice, reducedMotion: true }), { enabled: false, reason: 'system' })
  }
})

test('saved preferences accept only supported values', () => {
  assert.equal(parseMotionPreference('on'), 'on')
  assert.equal(parseMotionPreference('off'), 'off')
  assert.equal(parseMotionPreference(undefined), 'auto')
  assert.equal(parseMotionPreference('unexpected'), 'auto')
})
