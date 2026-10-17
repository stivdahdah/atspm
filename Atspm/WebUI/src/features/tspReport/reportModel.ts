import type { Approach, SearchLocation } from '@/api/config'
import { z } from 'zod'

export type TspLocation = SearchLocation & {
  approaches: Approach[]
  designatedPhases: number[]
}
export function getPhases(location: Pick<TspLocation, 'approaches'>): number[] {
  return [
    ...new Set(
      location.approaches.flatMap((a) =>
        a.protectedPhaseNumber == null ? [] : [a.protectedPhaseNumber]
      )
    ),
  ].sort((a, b) => a - b)
}
export function readTspLocation(
  location: SearchLocation & {
    approaches?: Approach[] | null
    designatedPhases?: number[]
  }
): TspLocation {
  const approaches = location.approaches ?? []
  const phases = getPhases({ approaches })
  return {
    ...location,
    approaches,
    designatedPhases:
      location.designatedPhases?.slice() ??
      (phases.includes(2) && phases.includes(6) ? [2, 6] : []),
  }
}
const savedOptionsSchema = z.object({
  locationsAndPhases: z.array(
    z.object({
      locationIdentifier: z.string().min(1),
      designatedPhases: z.array(z.number().int()).default([]),
    })
  ),
  dates: z.array(
    z
      .string()
      .refine(
        (value) => Number.isFinite(new Date(value).getTime()),
        'Invalid saved report date'
      )
  ),
})
export function readSavedTspOptions(value: unknown) {
  return savedOptionsSchema.parse(value)
}
export interface TspReportOptions {
  selectedDays: Date[]
  locations: TspLocation[]
}
