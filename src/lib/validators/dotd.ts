import { z } from 'zod'

export const DriverOfDayValidator = z.object({
  season: z.number().int().min(1950).max(2200),
  round: z.number().int().min(1).max(40),
  driverId: z.string().regex(/^[a-z0-9_]{1,60}$/),
})

export type DriverOfDayRequest = z.infer<typeof DriverOfDayValidator>
