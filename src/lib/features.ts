/**
 * Premium (Stripe subscriptions) is switched off until the project is published.
 * Set NEXT_PUBLIC_PREMIUM_ENABLED=true (at build time) to show the Premium UI,
 * enable the checkout endpoints and restrict the F1 dashboard to PREMIUM/ADMIN.
 * While it is off, the dashboard is open to every signed-in user.
 */
export const PREMIUM_ENABLED = process.env.NEXT_PUBLIC_PREMIUM_ENABLED === 'true'

/** Can this role open the F1 dashboard under the current feature flags? */
export function canAccessDashboard(role?: string | null) {
  if (!PREMIUM_ENABLED) return true
  return role === 'PREMIUM' || role === 'ADMIN'
}
