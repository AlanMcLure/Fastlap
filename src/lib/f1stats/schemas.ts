import { z } from 'zod'

// Shapes of the api-f1 responses used by the dashboard. Unknown fields are ignored (zod strips them).

const num = z.number()
const optNum = z.number().nullable()
const optStr = z.string().nullable()

// ---- F1DB ----------------------------------------------------------------------------------------

export const StatsRaceSchema = z.object({
  id: num,
  year: num,
  round: num,
  date: z.string(),
  grandPrixId: z.string(),
  officialName: z.string(),
  circuitId: z.string(),
  circuitLayoutId: z.string(),
  courseLength: optNum,
  turns: optNum,
  laps: optNum,
  distance: optNum,
})
export type StatsRace = z.infer<typeof StatsRaceSchema>

export const StatsDriverSchema = z.object({
  id: z.string(),
  name: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  abbreviation: z.string(),
  permanentNumber: optStr,
  dateOfBirth: optStr,
  nationalityCountryId: z.string(),
  totalChampionshipWins: num,
  totalRaceStarts: num,
  totalRaceWins: num,
  totalPodiums: num,
  totalPolePositions: num,
  totalFastestLaps: num,
  totalPoints: num,
  totalGrandSlams: num,
})
export type StatsDriver = z.infer<typeof StatsDriverSchema>

export const StatsConstructorSchema = z.object({
  id: z.string(),
  name: z.string(),
  fullName: z.string(),
  countryId: z.string(),
  totalChampionshipWins: num,
  totalRaceStarts: num,
  totalRaceWins: num,
  total1And2Finishes: num,
  totalPodiums: num,
  totalPolePositions: num,
  totalFastestLaps: num,
  totalPoints: num,
})
export type StatsConstructor = z.infer<typeof StatsConstructorSchema>

export const pageOf = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    content: z.array(item),
    page: z.object({ size: num, number: num, totalElements: num, totalPages: num }),
  })

export const CircuitSchema = z.object({
  id: z.string(),
  name: z.string(),
  fullName: z.string(),
  previousNames: optStr,
  type: z.string(),
  direction: optStr,
  placeName: z.string(),
  countryId: z.string(),
  latitude: optNum,
  longitude: optNum,
  length: optNum,
  turns: optNum,
  totalRacesHeld: num,
})
export type Circuit = z.infer<typeof CircuitSchema>

const LeaderSchema = z.object({ id: z.string(), name: optStr, wins: num })

export const CircuitHistorySchema = z.object({
  circuitId: z.string(),
  races: num,
  poleToWin: num,
  poleToWinPercent: optNum,
  mostWinsDrivers: z.array(LeaderSchema),
  mostWinsConstructors: z.array(LeaderSchema),
  editions: z.array(
    z.object({
      year: num,
      round: num,
      raceId: num,
      grandPrixId: z.string(),
      circuitLayoutId: z.string(),
      winnerId: optStr,
      winnerName: optStr,
      winnerConstructorId: optStr,
      winnerConstructorName: optStr,
      poleId: optStr,
      poleName: optStr,
      fastestLapId: optStr,
      fastestLapName: optStr,
      fastestLapTime: optStr,
    })
  ),
})
export type CircuitHistory = z.infer<typeof CircuitHistorySchema>

export const StandingsProgressionSchema = z.object({
  year: num,
  rounds: z.array(z.object({ round: num, raceId: num, grandPrixId: z.string(), date: z.string() })),
  standings: z.array(
    z.object({
      driverId: z.string().optional(),
      constructorId: z.string().optional(),
      engineManufacturerId: z.string().optional(),
      position: optNum,
      points: num,
      pointsByRound: z.array(optNum),
      positionsByRound: z.array(optNum),
    })
  ),
})
export type StandingsProgression = z.infer<typeof StandingsProgressionSchema>

const TallySchema = z.object({ driver: num, opponent: num })

export const TeammateBattleSchema = z.object({
  constructorId: z.string(),
  constructorName: optStr,
  driverId: z.string(),
  driverName: optStr,
  teammateId: z.string(),
  teammateName: optStr,
  races: num,
  raceFinishes: TallySchema,
  qualifyings: num,
  qualifying: TallySchema,
  points: z.object({ driver: num, opponent: num }),
  qualifyingGapPercent: optNum,
  qualifyingGapSamples: num,
})
export type TeammateBattle = z.infer<typeof TeammateBattleSchema>

export const QualifyingPaceSchema = z.object({
  year: num,
  rounds: z.array(
    z.object({ round: num, raceId: num, grandPrixId: z.string(), date: z.string(), bestTimeMillis: num })
  ),
  teams: z.array(
    z.object({
      constructorId: z.string(),
      constructorName: optStr,
      medianGapPercent: optNum,
      fastestCount: num,
      gapPercentByRound: z.array(optNum),
    })
  ),
})
export type QualifyingPace = z.infer<typeof QualifyingPaceSchema>

export const DriverSeasonStatsSchema = z.object({
  position: optNum,
  driverId: z.string(),
  driverName: optStr,
  constructorIds: z.array(z.string()),
  points: num,
  races: num,
  wins: num,
  podiums: num,
  pointsFinishes: num,
  poles: num,
  fastestLaps: num,
  sprintWins: num,
  retirements: num,
  bestFinish: optNum,
  averageGrid: optNum,
  averageFinish: optNum,
  positionsGained: num,
})
export type DriverSeasonStats = z.infer<typeof DriverSeasonStatsSchema>

// ---- OpenF1 (2023 on) ----------------------------------------------------------------------------

export const TimingSessionSchema = z.object({
  sessionKey: num,
  sessionName: z.string(),
  sessionType: z.string(),
  slug: optStr,
  dateStart: z.string(),
  dateEnd: optStr,
})
export type TimingSession = z.infer<typeof TimingSessionSchema>

export const SessionDriverSchema = z.object({
  driverNumber: num,
  driverId: optStr,
  fullName: optStr,
  nameAcronym: optStr,
  teamName: optStr,
  teamColour: optStr,
  headshotUrl: optStr,
})
export type SessionDriver = z.infer<typeof SessionDriverSchema>

export const SummarySchema = z.object({
  driverId: optStr,
  driverNumber: num,
  nameAcronym: optStr,
  teamName: optStr,
  teamColour: optStr,
  startPosition: optNum,
  finishPosition: optNum,
  positionsGained: optNum,
  lapsCompleted: num,
  bestLap: optNum,
  bestLapNumber: optNum,
  averageLap: optNum,
  topSpeed: optNum,
  pitStops: num,
  compounds: z.array(z.string().nullable()),
  overtakesMade: num,
  overtakesSuffered: num,
})
export type DriverSummary = z.infer<typeof SummarySchema>

export const StintSchema = z.object({
  driverNumber: num,
  stintNumber: num,
  driverId: optStr,
  lapStart: optNum,
  lapEnd: optNum,
  compound: optStr,
  tyreAgeAtStart: optNum,
})
export type Stint = z.infer<typeof StintSchema>

export const StintPaceSchema = z.object({
  driverId: optStr,
  driverNumber: num,
  stintNumber: num,
  compound: optStr,
  lapStart: optNum,
  lapEnd: optNum,
  tyreAgeAtStart: optNum,
  representativeLaps: num,
  averageLap: optNum,
  bestLap: optNum,
  degradationPerLap: optNum,
})
export type StintPace = z.infer<typeof StintPaceSchema>

export const PitSchema = z.object({
  driverNumber: num,
  driverId: optStr,
  date: z.string(),
  lapNumber: optNum,
  laneDuration: optNum,
  stopDuration: optNum,
})
export type Pit = z.infer<typeof PitSchema>

export const WeatherSchema = z.object({
  date: z.string(),
  airTemperature: optNum,
  trackTemperature: optNum,
  humidity: optNum,
  rainfall: z.boolean().nullable(),
  windSpeed: optNum,
})
export type Weather = z.infer<typeof WeatherSchema>

export const RaceControlSchema = z.object({
  date: z.string(),
  lapNumber: optNum,
  category: optStr,
  flag: optStr,
  scope: optStr,
  driverNumber: optNum,
  driverId: optStr,
  message: z.string(),
})
export type RaceControlMessage = z.infer<typeof RaceControlSchema>

export const OvertakeSchema = z.object({
  date: z.string(),
  overtakingDriverNumber: num,
  overtakenDriverNumber: num,
  position: optNum,
})
export type Overtake = z.infer<typeof OvertakeSchema>

export const LapChartSchema = z.object({
  driverId: optStr,
  driverNumber: num,
  nameAcronym: optStr,
  teamColour: optStr,
  positions: z.array(z.object({ lap: num, position: num })),
})
export type LapChartSeries = z.infer<typeof LapChartSchema>

export const GapSeriesSchema = z.object({
  driverId: optStr,
  driverNumber: num,
  nameAcronym: optStr,
  teamColour: optStr,
  gaps: z.array(z.object({ lap: num, gap: num })),
})
export type GapSeries = z.infer<typeof GapSeriesSchema>

export const BestLapSchema = z.object({
  position: optNum,
  driverId: optStr,
  driverNumber: num,
  nameAcronym: optStr,
  teamName: optStr,
  teamColour: optStr,
  bestLap: optNum,
  bestLapNumber: optNum,
  gap: optNum,
  bestSector1: optNum,
  bestSector2: optNum,
  bestSector3: optNum,
  idealLap: optNum,
  topSpeed: optNum,
  laps: num,
})
export type BestLap = z.infer<typeof BestLapSchema>

export const LapComparisonSchema = z.object({
  driverA: z.string(),
  driverB: z.string(),
  lapsFasterA: num,
  lapsFasterB: num,
  averageDelta: optNum,
  laps: z.array(z.object({ lap: num, timeA: optNum, timeB: optNum, delta: optNum, gap: optNum })),
})
export type LapComparison = z.infer<typeof LapComparisonSchema>

export const SeasonPitStopsSchema = z.object({
  year: num,
  fastest: z.array(
    z.object({
      raceId: num,
      round: num,
      grandPrixId: z.string(),
      driverId: optStr,
      teamName: optStr,
      lap: optNum,
      stopDuration: optNum,
      laneDuration: optNum,
    })
  ),
  teams: z.array(
    z.object({
      teamName: z.string(),
      stops: num,
      laneDeltaToRaceMedian: optNum,
      stopsWithStopDuration: num,
      averageStopDuration: optNum,
      bestStopDuration: optNum,
    })
  ),
})
export type SeasonPitStops = z.infer<typeof SeasonPitStopsSchema>
