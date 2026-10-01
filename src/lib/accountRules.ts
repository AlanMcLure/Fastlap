import type { UserRole } from '@prisma/client'

/** Stand-in author of the posts and comments of deleted accounts. */
export const DELETED_USER = {
  email: 'eliminado@fastlap.invalid',
  username: 'eliminado',
  name: 'Usuario eliminado',
} as const

/** Usernames nobody can pick: they belong to system accounts or look like them. */
const RESERVED_USERNAMES = new Set(['eliminado', 'fastlap', 'sistema', 'admin', 'administrador', 'moderador'])

export function isReservedUsername(name: string): boolean {
  return RESERVED_USERNAMES.has(name.toLowerCase())
}

/** Why an account cannot be deleted right now, or null when it can. */
export function deletionBlocker(role: UserRole): string | null {
  return role === 'ADMIN'
    ? 'Una cuenta de administrador no se puede eliminar desde aquí: pide antes que se le quite el rol.'
    : null
}

/** The user must type their own username to confirm. */
export function confirmationMatches(input: string, username: string | null): boolean {
  return !!username && input.trim() === username
}

/**
 * Notifications of other people quote the actor ("u/ana ha comentado…"). When `ana` leaves,
 * the name is replaced so it does not outlive the account.
 */
export function anonymizeActor(body: string, username: string): string {
  return body.split(`u/${username} `).join('Un usuario ')
}
