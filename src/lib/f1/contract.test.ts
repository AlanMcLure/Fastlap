import { existsSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { fixture } from './fixtures'
import {
  ConstructorStandingsResponseSchema,
  DriverStandingsResponseSchema,
  DriversResponseSchema,
  PitStopsResponseSchema,
  RacesResponseSchema,
  ResultsResponseSchema,
} from './schemas'

// Contract tests: validate REAL Jolpica responses captured with
// `node scripts/capture-f1-fixtures.mjs` (saved in __fixtures__/real/).
// Skipped when nothing has been captured yet.
const cases = {
  calendar: RacesResponseSchema,
  'driver-standings': DriverStandingsResponseSchema,
  'constructor-standings': ConstructorStandingsResponseSchema,
  'race-results': ResultsResponseSchema,
  drivers: DriversResponseSchema,
  pitstops: PitStopsResponseSchema,
  'driver-results': ResultsResponseSchema,
} as const

describe('real Jolpica responses match the schemas', () => {
  for (const [name, schema] of Object.entries(cases)) {
    const file = path.join(__dirname, '__fixtures__', 'real', `${name}.json`)
    it.skipIf(!existsSync(file))(name, () => {
      const result = schema.safeParse(fixture(`real/${name}`))
      expect(result.success ? [] : result.error.issues).toEqual([])
    })
  }
})
