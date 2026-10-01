/** Minimum age to create an account in Spain (art. 7 LOPDGDD). */
export const MIN_AGE = 14

/** Bump when the terms or the privacy policy change in a way that needs a new acceptance. */
export const TERMS_VERSION = '1'

/** Short-lived cookie set by the sign-in form once the box is ticked; the server checks it. */
export const CONSENT_COOKIE = 'fastlap-consent'
export const CONSENT_COOKIE_MAX_AGE_SECONDS = 600

export const CONSENT_TEXT = `Tengo al menos ${MIN_AGE} años y acepto las Condiciones de uso y la Política de privacidad.`

export function hasValidConsent(cookieValue: string | undefined): boolean {
  return cookieValue === TERMS_VERSION
}

/**
 * Who may sign in: anyone who already has an account, and a new person only after declaring
 * their age and accepting the terms. It is a self-declaration: Google does not tell us the
 * birth date, so the age cannot be verified.
 */
export function canSignIn(existingUser: boolean, cookieValue: string | undefined): boolean {
  return existingUser || hasValidConsent(cookieValue)
}
