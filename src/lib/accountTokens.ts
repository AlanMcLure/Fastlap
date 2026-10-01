import type { AdapterAccount } from 'next-auth/adapters'

/**
 * Campos de `Account` con credenciales del proveedor (Google). La app solo usa
 * Google para identificar al usuario con sesión JWT, así que no se guardan.
 */
export const PROVIDER_TOKEN_FIELDS = [
  'access_token',
  'refresh_token',
  'id_token',
] as const

export function stripProviderTokens(account: AdapterAccount): AdapterAccount {
  const clean = { ...account }
  for (const field of PROVIDER_TOKEN_FIELDS) delete clean[field]
  return clean
}
