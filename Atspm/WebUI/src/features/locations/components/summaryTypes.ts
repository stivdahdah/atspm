import type { Detector, DetectorComment } from '@/api/config'

type NumericDisplay = number | string | null
type SummaryDetectionType = {
  abbreviation?: string | null
  description?: string | null
}
export type SummaryDetector = Omit<
  Detector,
  | 'approach'
  | 'detectorChannel'
  | 'latencyCorrection'
  | 'detectionTypes'
  | 'detectorComments'
  | 'movementType'
  | 'laneType'
  | 'detectionHardware'
> & {
  approach?: SummaryApproach
  detectorChannel?: NumericDisplay
  latencyCorrection?: NumericDisplay
  movementType?: number | string
  laneType?: number | string
  detectionHardware?: number | string
  detectionTypes?: readonly SummaryDetectionType[] | null
  detectorComments?:
    | readonly (string | Pick<DetectorComment, 'comment'>)[]
    | null
}
export type SummaryApproach = {
  id?: number
  directionType?: { description?: string | null }
  protectedPhaseNumber?: NumericDisplay
  permissivePhaseNumber?: NumericDisplay
  isProtectedPhaseOverlap?: boolean
  detectors?: readonly SummaryDetector[] | null
}
/** Read-only fields shared by loaded configuration entities and unsaved editor drafts. */
export type LocationSummary = {
  primaryName?: string | null
  secondaryName?: string | null
  locationTypeId?: number
  approaches?: readonly SummaryApproach[] | null
}
