import { describe, expect, it } from 'vitest'
import { canSignIn, hasValidConsent, MIN_AGE, TERMS_VERSION } from './consent'

describe('consent', () => {
  it('la edad mínima es 14 (LOPDGDD)', () => {
    expect(MIN_AGE).toBe(14)
  })

  it('solo vale la versión vigente', () => {
    expect(hasValidConsent(TERMS_VERSION)).toBe(true)
    expect(hasValidConsent('0')).toBe(false)
    expect(hasValidConsent('')).toBe(false)
    expect(hasValidConsent(undefined)).toBe(false)
  })

  it('un usuario existente entra sin más; uno nuevo necesita la declaración', () => {
    expect(canSignIn(true, undefined)).toBe(true)
    expect(canSignIn(false, undefined)).toBe(false)
    expect(canSignIn(false, 'otra')).toBe(false)
    expect(canSignIn(false, TERMS_VERSION)).toBe(true)
  })
})
