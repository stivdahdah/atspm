import type {
  Approach,
  ApproachDto,
  Area,
  DetectionType,
  Detector,
  DetectorDto,
  Location,
} from '@/api/config'
import {
  DetectionHardwareTypes,
  DetectionTypes,
  DirectionTypes,
  LaneTypes,
  MovementTypes,
} from '@/api/config'
import { dateToTimestamp } from '@/utils/dateTime'
import { removeAuditFields } from '@/utils/removeAuditFields'
import { format, parseISO } from 'date-fns'

type FormNumber = number | string | null
export type ConfigDetectionType = Pick<
  DetectionType,
  'description' | 'displayOrder'
> & {
  id?: number | string
  abbreviation: string
}
export type ConfigDetector = Omit<
  Detector,
  | 'id'
  | 'detectionTypes'
  | 'detectorChannel'
  | 'movementType'
  | 'laneType'
  | 'detectionHardware'
  | 'latencyCorrection'
  | 'dateAdded'
> & {
  id: number
  isNew?: boolean
  detectorChannel: FormNumber
  detectionTypes: ConfigDetectionType[]
  movementType: number | string
  laneType: number | string
  detectionHardware: number | string
  latencyCorrection: FormNumber
  dateAdded: string
}
export type ConfigApproach = Omit<
  Approach,
  | 'id'
  | 'detectors'
  | 'protectedPhaseNumber'
  | 'permissivePhaseNumber'
  | 'pedestrianPhaseNumber'
  | 'transitSignalPriorityNumber'
  | 'directionTypeId'
> & {
  id: number
  index?: number
  open?: boolean
  isNew?: boolean
  detectors: ConfigDetector[]
  directionTypeId: number | string
  protectedPhaseNumber: FormNumber
  permissivePhaseNumber?: FormNumber
  pedestrianPhaseNumber?: FormNumber
  transitSignalPriorityNumber?: FormNumber
}
export type ConfigLocation = Omit<
  Location,
  'id' | 'approaches' | 'areas' | 'latitude' | 'longitude' | 'start'
> & {
  id: number
  approaches: ConfigApproach[]
  areas: (Area & { id: number })[]
  latitude: number | string
  longitude: number | string
  start: string
}

function requireId(id: number | null | undefined, kind: string) {
  if (id == null || !Number.isInteger(id))
    throw new Error(`${kind} is missing its ID.`)
  return id
}
export function readConfigApproach(
  dto: Approach | ApproachDto
): ConfigApproach {
  return {
    ...dto,
    id: requireId(dto.id, 'Approach'),
    directionTypeId: dto.directionTypeId ?? 'NA',
    protectedPhaseNumber: dto.protectedPhaseNumber ?? null,
    detectors: (dto.detectors ?? []).map((d) => ({
      ...d,
      id: requireId(d.id, 'Detector'),
      approachId: d.approachId ?? undefined,
      detectorChannel: d.detectorChannel ?? null,
      dateAdded: d.dateAdded ?? '',
      latencyCorrection: d.latencyCorrection ?? 0,
      detectionHardware: d.detectionHardware ?? 'NA',
      movementType: d.movementType ?? 'NA',
      laneType: d.laneType ?? 'NA',
      detectionTypes: (d.detectionTypes ?? []).map((t) => ({
        id: t.id ?? undefined,
        abbreviation: t.abbreviation ?? 'NA',
        description: t.description,
        displayOrder: t.displayOrder,
      })),
    })),
  }
}
export function readConfigLocation(dto: Location): ConfigLocation {
  return {
    ...dto,
    id: requireId(dto.id, 'Location'),
    start: dto.start ?? '',
    latitude: dto.latitude ?? '',
    longitude: dto.longitude ?? '',
    areas: (dto.areas ?? []).map((a) => ({
      ...a,
      id: requireId(a.id, 'Area'),
    })),
    approaches: (dto.approaches ?? []).map(readConfigApproach),
  }
}

type EnumMember = { name: string; value: number }
type FindMember = (value: string | number) => EnumMember | undefined
export type ApproachEnumLookups = {
  direction: FindMember
  detection: FindMember
  hardware: FindMember
  movement: FindMember
  lane: FindMember
}
function enumValue<T extends number>(
  value: number | string | undefined,
  find: FindMember,
  values: T[]
): T {
  const candidate =
    typeof value === 'number' ? value : find(value ?? 'NA')?.value
  const matched = values.find((v) => v === candidate)
  if (matched == null)
    throw new Error(`Unknown configuration enum value: ${value ?? 'NA'}`)
  return matched
}
export function formNumber(value: FormNumber | undefined): number | null {
  if (value == null || value === '') return null
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) throw new Error('Enter a valid number.')
  return numeric
}
export function approachToDto(
  approach: ConfigApproach,
  identifier: string,
  enums: ApproachEnumLookups
): ApproachDto {
  const protectedPhaseNumber = formNumber(approach.protectedPhaseNumber)
  if (protectedPhaseNumber == null)
    throw new Error('A Phase Number is required')
  const { index, open, isNew, id, detectors, directionType, ...base } = approach
  return {
    ...removeAuditFields(base),
    id: isNew ? undefined : id,
    protectedPhaseNumber,
    permissivePhaseNumber: formNumber(approach.permissivePhaseNumber),
    pedestrianPhaseNumber: formNumber(approach.pedestrianPhaseNumber),
    transitSignalPriorityNumber: formNumber(
      approach.transitSignalPriorityNumber
    ),
    directionTypeId: enumValue(
      approach.directionTypeId,
      enums.direction,
      Object.values(DirectionTypes)
    ),
    detectors: detectors.map((d) => {
      const {
        isNew: newDetector,
        id: detectorId,
        approach,
        detectorComments,
        detectionTypes,
        ...detector
      } = d
      const channel = formNumber(d.detectorChannel)
      if (channel == null || channel <= 0)
        throw new Error('Detector Channel is required')
      const result: DetectorDto = {
        ...removeAuditFields(detector),
        id: newDetector ? undefined : detectorId,
        approachId: isNew ? undefined : detector.approachId,
        detectorChannel: channel,
        latencyCorrection: formNumber(d.latencyCorrection) ?? 0,
        dectectorIdentifier: d.dectectorIdentifier || identifier + channel,
        dateAdded: dateToTimestamp(d.dateAdded),
        detectionHardware: enumValue(
          d.detectionHardware,
          enums.hardware,
          Object.values(DetectionHardwareTypes)
        ),
        movementType: enumValue(
          d.movementType,
          enums.movement,
          Object.values(MovementTypes)
        ),
        laneType: enumValue(d.laneType, enums.lane, Object.values(LaneTypes)),
        detectionTypes: detectionTypes.map((t) => ({
          ...t,
          id: enumValue(
            t.abbreviation,
            enums.detection,
            Object.values(DetectionTypes)
          ),
        })),
      }
      return result
    }),
  }
}

export function locationGeneralToDto(location: ConfigLocation): Location {
  const {
    approaches,
    devices,
    region,
    jurisdiction,
    locationType,
    ...general
  } = location
  const latitude = formNumber(location.latitude)
  const longitude = formNumber(location.longitude)
  if (latitude == null || longitude == null)
    throw new Error('Latitude and longitude are required.')
  return removeAuditFields({
    ...general,
    latitude,
    longitude,
    start: format(parseISO(location.start), 'yyyy-MM-dd'),
    regionId: formNumber(location.regionId),
    jurisdictionId: formNumber(location.jurisdictionId),
    locationTypeId: formNumber(location.locationTypeId) ?? undefined,
    areas: location.areas.map(removeAuditFields),
  })
}
