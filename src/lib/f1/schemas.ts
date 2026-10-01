import { z } from 'zod'

// Jolpica-F1 (Ergast-compatible) sends every number as a string. The schemas
// below validate the response and convert to domain types (numbers, not strings).
// Unknown fields are ignored; missing required fields make the parse fail.

const num = z.string().transform((value, ctx) => {
  const n = Number(value)
  if (value.trim() === '' || Number.isNaN(n)) {
    ctx.addIssue({ code: 'custom', message: `Expected a numeric string, got "${value}"` })
    return z.NEVER
  }
  return n
})

const session = z.object({ date: z.string(), time: z.string().optional() })

export const DriverSchema = z.object({
  driverId: z.string(),
  permanentNumber: z.string().optional(),
  code: z.string().optional(),
  url: z.string().optional(),
  givenName: z.string(),
  familyName: z.string(),
  dateOfBirth: z.string(),
  nationality: z.string(),
})

export const ConstructorSchema = z.object({
  constructorId: z.string(),
  url: z.string().optional(),
  name: z.string(),
  nationality: z.string(),
})

export const CircuitSchema = z.object({
  circuitId: z.string(),
  url: z.string().optional(),
  circuitName: z.string(),
  Location: z.object({
    lat: num,
    long: num,
    locality: z.string(),
    country: z.string(),
  }),
})

export const RaceSchema = z.object({
  season: num,
  round: num,
  url: z.string().optional(),
  raceName: z.string(),
  Circuit: CircuitSchema,
  date: z.string(),
  time: z.string().optional(),
  FirstPractice: session.optional(),
  SecondPractice: session.optional(),
  ThirdPractice: session.optional(),
  Qualifying: session.optional(),
  Sprint: session.optional(),
  SprintQualifying: session.optional(),
})

export const ResultSchema = z.object({
  number: z.string().optional(),
  position: num,
  positionText: z.string(),
  points: num,
  Driver: DriverSchema,
  Constructor: ConstructorSchema,
  grid: num,
  laps: num,
  status: z.string(),
  Time: z.object({ millis: num.optional(), time: z.string() }).optional(),
  FastestLap: z
    .object({
      rank: num.optional(),
      lap: num.optional(),
      Time: z.object({ time: z.string() }).optional(),
      AverageSpeed: z.object({ units: z.string(), speed: num }).optional(),
    })
    .optional(),
})

export const RaceWithResultsSchema = RaceSchema.extend({ Results: z.array(ResultSchema) })

export const RaceWithSprintResultsSchema = RaceSchema.extend({ SprintResults: z.array(ResultSchema) })

export const PitStopSchema = z.object({
  driverId: z.string(),
  stop: num,
  lap: num,
  time: z.string(),
  duration: z.string(),
})

export const RaceWithPitStopsSchema = RaceSchema.extend({ PitStops: z.array(PitStopSchema) })

export const DriverStandingSchema = z.object({
  position: num.optional(),
  positionText: z.string(),
  points: num,
  wins: num,
  Driver: DriverSchema,
  Constructors: z.array(ConstructorSchema),
})

export const ConstructorStandingSchema = z.object({
  position: num.optional(),
  positionText: z.string(),
  points: num,
  wins: num,
  Constructor: ConstructorSchema,
})

const envelope = <T extends z.ZodRawShape>(table: T) =>
  z.object({
    MRData: z.object({ total: num }).extend(table),
  })

export const RacesResponseSchema = envelope({
  RaceTable: z.object({ Races: z.array(RaceSchema) }),
})

export const ResultsResponseSchema = envelope({
  RaceTable: z.object({ Races: z.array(RaceWithResultsSchema) }),
})

export const SprintResultsResponseSchema = envelope({
  RaceTable: z.object({ Races: z.array(RaceWithSprintResultsSchema) }),
})

export const PitStopsResponseSchema = envelope({
  RaceTable: z.object({ Races: z.array(RaceWithPitStopsSchema) }),
})

export const DriversResponseSchema = envelope({
  DriverTable: z.object({ Drivers: z.array(DriverSchema) }),
})

export const DriverStandingsResponseSchema = envelope({
  StandingsTable: z.object({
    StandingsLists: z.array(
      z.object({ season: num, round: num, DriverStandings: z.array(DriverStandingSchema) })
    ),
  }),
})

export const ConstructorStandingsResponseSchema = envelope({
  StandingsTable: z.object({
    StandingsLists: z.array(
      z.object({ season: num, round: num, ConstructorStandings: z.array(ConstructorStandingSchema) })
    ),
  }),
})

export type Driver = z.infer<typeof DriverSchema>
export type Constructor = z.infer<typeof ConstructorSchema>
export type Circuit = z.infer<typeof CircuitSchema>
export type Race = z.infer<typeof RaceSchema>
export type Result = z.infer<typeof ResultSchema>
export type RaceWithResults = z.infer<typeof RaceWithResultsSchema>
export type RaceWithSprintResults = z.infer<typeof RaceWithSprintResultsSchema>
export type PitStop = z.infer<typeof PitStopSchema>
export type DriverStanding = z.infer<typeof DriverStandingSchema>
export type ConstructorStanding = z.infer<typeof ConstructorStandingSchema>
