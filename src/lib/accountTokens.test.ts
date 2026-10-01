import { describe, expect, it } from 'vitest'
import type { AdapterAccount } from 'next-auth/adapters'
import { stripProviderTokens } from './accountTokens'

const account = {
  userId: 'u1',
  type: 'oidc',
  provider: 'google',
  providerAccountId: '123',
  access_token: 'ya29.secret',
  refresh_token: '1//secret',
  id_token: 'eyJ.secret',
  expires_at: 1700000000,
  token_type: 'bearer',
  scope: 'openid email profile',
} as AdapterAccount

describe('stripProviderTokens', () => {
  it('quita los tres tokens', () => {
    const clean = stripProviderTokens(account)
    expect(clean).not.toHaveProperty('access_token')
    expect(clean).not.toHaveProperty('refresh_token')
    expect(clean).not.toHaveProperty('id_token')
  })

  it('conserva lo necesario para enlazar la cuenta', () => {
    const clean = stripProviderTokens(account)
    expect(clean).toMatchObject({
      userId: 'u1',
      provider: 'google',
      providerAccountId: '123',
      type: 'oidc',
    })
  })

  it('no modifica el objeto original', () => {
    stripProviderTokens(account)
    expect(account.access_token).toBe('ya29.secret')
  })
})
