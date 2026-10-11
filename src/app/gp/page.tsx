import { notFound, redirect } from 'next/navigation'

import { getNextRace } from '@/lib/f1/queries'
import { withTimeout } from '@/lib/timeout'

export const dynamic = 'force-dynamic'

/** "GP" in the navigation: the hub of the race weekend in progress, or of the next one. */
export default async function CurrentGrandPrix() {
  const race = await withTimeout(getNextRace(), 8000).catch(() => null)
  if (!race) notFound()
  redirect(`/gp/${race.season}/${race.round}`)
}
