import type { Approach, SearchLocation } from '@/api/config'
import { PedestrianTimeUnit, type PedatLocationData } from '@/api/reports'
import { roundTo } from '@/utils/numberFormat'

export type PedestrianLocation = SearchLocation & {
  id: number
  locationIdentifier: string
  approaches: Approach[]
  pedsAre1to1?: boolean
}
export type PedestrianPhase = number | 'All' | null | undefined

export function readPedestrianLocation(
  location: SearchLocation & {
    approaches?: Approach[] | null
    pedsAre1to1?: boolean
  }
): PedestrianLocation {
  if (
    location.id == null ||
    !Number.isInteger(location.id) ||
    !location.locationIdentifier
  ) {
    throw new Error('A location ID and identifier are required.')
  }
  return {
    ...location,
    id: location.id,
    locationIdentifier: location.locationIdentifier,
    approaches: location.approaches ?? [],
  }
}
export function readPedestrianTimeUnit(value: number): PedestrianTimeUnit {
  return (
    Object.values(PedestrianTimeUnit).find((unit) => unit === value) ??
    PedestrianTimeUnit.NUMBER_0
  )
}
const roundOptional = (value: number | undefined) =>
  value == null ? value : Math.round(value)
/** Prepare display values without changing the cached response or inventing missing data. */
export function roundPedestrianData(
  location: PedatLocationData
): PedatLocationData {
  const stats = location.statisticData
  return {
    ...location,
    totalVolume: roundOptional(location.totalVolume),
    averageDailyVolume: roundOptional(location.averageDailyVolume),
    averageVolumeByHourOfDay:
      location.averageVolumeByHourOfDay?.map((item) => ({
        ...item,
        volume: roundOptional(item.volume),
      })) ?? location.averageVolumeByHourOfDay,
    averageVolumeByDayOfWeek:
      location.averageVolumeByDayOfWeek?.map((item) => ({
        ...item,
        volume: roundOptional(item.volume),
      })) ?? location.averageVolumeByDayOfWeek,
    averageVolumeByMonthOfYear:
      location.averageVolumeByMonthOfYear?.map((item) => ({
        ...item,
        volume: roundOptional(item.volume),
      })) ?? location.averageVolumeByMonthOfYear,
    rawData:
      location.rawData?.map((item) => ({
        ...item,
        pedestrianCount: roundTo(item.pedestrianCount, 0),
      })) ?? location.rawData,
    statisticData: stats
      ? {
          ...stats,
          count: roundTo(stats.count, 0),
          max: roundTo(stats.max, 0),
          min: roundTo(stats.min, 0),
          mean: roundTo(stats.mean, 0),
          std: roundTo(stats.std, 0),
          fiftiethPercentile: roundTo(stats.fiftiethPercentile, 0),
          seventyFifthPercentile: roundTo(stats.seventyFifthPercentile, 0),
          twentyFifthPercentile: roundTo(stats.twentyFifthPercentile, 0),
        }
      : stats,
  }
}
