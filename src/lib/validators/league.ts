import { z } from 'zod'

import { MAX_RULE_POINTS } from '@/lib/league'

const points = z.number().int().min(0).max(MAX_RULE_POINTS)
const driverId = z.string().regex(/^[a-z0-9_]{1,60}$/)

export const LeagueCreateValidator = z.object({
  subredditId: z.string(),
  exactPoints: points,
  presentPoints: points,
  fastestLapPoints: points,
  sprintEnabled: z.boolean(),
})

export const PredictionValidator = z.object({
  leagueId: z.string(),
  round: z.number().int().min(1).max(40),
  kind: z.enum(['RACE', 'SPRINT']),
  p1: driverId,
  p2: driverId,
  p3: driverId,
  fastestLap: driverId.nullable().optional(),
})
