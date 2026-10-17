import type { NewSegment } from '@/api/speedManagement/aTSPMSpeedManagementApi.schemas'
import { DataSource } from '@/features/speedManagementTool/enums'
import { z } from 'zod'
export type Coordinate = [number, number]
const coordinate = z
  .array(z.number().finite())
  .min(2)
  .transform((value): Coordinate => [value[0], value[1]])
const text = z
  .string()
  .nullish()
  .transform((value) => value ?? null)
const number = z
  .number()
  .finite()
  .nullish()
  .transform((value) => value ?? null)
function normalizeFeature(value: unknown) {
  if (
    typeof value !== 'object' ||
    value == null ||
    !('properties' in value) ||
    typeof value.properties !== 'object' ||
    value.properties == null
  )
    return value
  const p = value.properties
  const properties: Record<string, unknown> = { ...p }
  for (const [key, field] of Object.entries(p))
    if (key) properties[key[0].toUpperCase() + key.slice(1)] ??= field
  properties.Id ??= 'id' in value ? value.id : undefined
  return { ...value, properties }
}
export const segmentFeatureSchema = z
  .preprocess(
    normalizeFeature,
    z.object({
      id: z.string().optional(),
      type: z.string().nullish(),
      geometry: z.object({
        type: z.literal('LineString'),
        coordinates: z.array(coordinate),
      }),
      properties: z
        .object({
          Id: z.string().min(1),
          UdotRouteNumber: z.string(),
          Name: z.string(),
          StartMilePoint: z.number().finite(),
          EndMilePoint: z.number().finite(),
          FunctionalType: z.string(),
          Direction: text,
          Polarity: z.enum(['PM', 'NM']).nullish(),
          SpeedLimit: z.number().finite(),
          Region: text,
          City: text,
          County: text,
          AlternateIdentifier: text,
          AccessCategory: text,
          Offset: number,
          Shape: z
            .unknown()
            .transform((value) => (typeof value === 'string' ? value : null)),
          ShapeWKT: text,
          RouteEntities: z.array(z.object({ Id: z.string() })).nullish(),
        })
        .passthrough(),
    })
  )
  .transform((feature) => ({
    ...feature,
    id: feature.id ?? feature.properties.Id,
    properties: {
      ...feature.properties,
      name: feature.properties.Name,
      speedLimit: feature.properties.SpeedLimit,
      startMilePoint: feature.properties.StartMilePoint,
      endMilePoint: feature.properties.EndMilePoint,
      udotRouteNumber: feature.properties.UdotRouteNumber,
    },
  }))
export type SegmentFeature = z.infer<typeof segmentFeatureSchema>
export type SegmentFeatureProperties = SegmentFeature['properties']
export type Segment = SegmentFeature
export function readSegmentCollection(value: unknown) {
  const collection = z.object({ features: z.array(z.unknown()) }).parse(value)
  return {
    features: collection.features.flatMap((feature) => {
      if (
        typeof feature !== 'object' ||
        feature == null ||
        !('geometry' in feature) ||
        typeof feature.geometry !== 'object' ||
        feature.geometry == null ||
        !('type' in feature.geometry) ||
        feature.geometry.type !== 'LineString'
      )
        return []
      return [segmentFeatureSchema.parse(feature)]
    }),
  }
}
export function readSegment(value: unknown): SegmentFeature {
  const feature = readSegmentCollection(value).features[0]
  if (!feature) throw new Error('The segment response contains no segment.')
  return feature
}
export interface SegmentProperties {
  id: string | null
  udotRouteNumber: string | null
  startMilePoint: number | null
  endMilePoint: number | null
  functionalType: string | null
  name: string | null
  direction: string | null
  polarity: 'PM' | 'NM' | null
  speedLimit: number | null
  region: string | null
  city: string | null
  county: string | null
  alternateIdentifier: string | null
  accessCategory: string | null
  offset: number | null
  shape: string | null
  shapeWKT: string | null
  entities: string[] | null
}
export function propertiesFromFeature(
  feature: SegmentFeature
): SegmentProperties {
  const p = feature.properties
  return {
    id: p.Id,
    udotRouteNumber: p.UdotRouteNumber,
    startMilePoint: p.StartMilePoint,
    endMilePoint: p.EndMilePoint,
    functionalType: p.FunctionalType,
    name: p.Name,
    direction: p.Direction,
    polarity: p.Polarity ?? 'PM',
    speedLimit: p.SpeedLimit,
    region: p.Region,
    city: p.City,
    county: p.County,
    alternateIdentifier: p.AlternateIdentifier,
    accessCategory: p.AccessCategory,
    offset: p.Offset,
    shape: p.Shape,
    shapeWKT: p.ShapeWKT,
    entities: p.RouteEntities?.map((entity) => entity.Id) ?? [],
  }
}
export function buildSegmentPayload(
  properties: SegmentProperties
): NewSegment & { shapeWKT: string | null } {
  const requiredText = (value: string | null, label: string) => {
    if (!value?.trim()) throw new Error(`${label} is required.`)
    return value
  }
  const requiredNumber = (value: number | null, label: string) => {
    if (value == null || !Number.isFinite(value))
      throw new Error(`${label} is required.`)
    return value
  }
  return {
    udotRouteNumber: requiredText(properties.udotRouteNumber, 'Route number'),
    startMilePoint: requiredNumber(
      properties.startMilePoint,
      'Start mile point'
    ),
    endMilePoint: requiredNumber(properties.endMilePoint, 'End mile point'),
    functionalType: requiredText(properties.functionalType, 'Functional type'),
    name: requiredText(properties.name, 'Name'),
    direction: properties.direction,
    speedLimit: requiredNumber(properties.speedLimit, 'Speed limit'),
    region: properties.region || null,
    city: properties.city,
    county: properties.county,
    shape: requiredText(properties.shape, 'Shape'),
    shapeWKT: properties.shapeWKT,
    alternateIdentifier: properties.alternateIdentifier,
    accessCategory: properties.accessCategory,
    offset: properties.offset,
  }
}
/** List-map coordinates are Leaflet lat/lng; draft and API coordinates stay GeoJSON lng/lat. */
export function toMapSegment(feature: SegmentFeature): Segment {
  return {
    ...feature,
    geometry: {
      ...feature.geometry,
      coordinates: feature.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    },
  }
}
export function buildDirections(
  direction: string | null | undefined,
  polarity: string | null | undefined
): string[] {
  const variants: Record<string, string[]> = {
    NB: ['N', 'NB', 'NW', 'NE'],
    SB: ['S', 'SB', 'SW', 'SE'],
    EB: ['E', 'EB', 'NE', 'SE'],
    WB: ['W', 'WB', 'NW', 'SW'],
  }
  return [
    ...(direction ? (variants[direction] ?? []) : []),
    ...(polarity ? [polarity] : []),
  ]
}

const entitySchema = z
  .object({
    id: z.string(),
    entityId: z.string(),
    entityType: z.string(),
    sourceId: z.nativeEnum(DataSource),
    coordinates: z.array(coordinate).min(1),
    version: z.string(),
    isWithin50Ft: z
      .boolean()
      .nullish()
      .transform((v) => v ?? undefined),
    direction: z.string(),
    startDate: z.string(),
    active: z.boolean().optional(),
    name: z.string().nullish(),
  })
  .passthrough()
export interface EditorEntity {
  id: string
  entityId: string
  entityType: string
  sourceId: DataSource
  coordinates: Coordinate[]
  version: string
  direction: string
  startDate: string
  active?: boolean
  isWithin50Ft?: boolean
  name?: string | null
}
export function readNearbyEntities(value: unknown): EditorEntity[] {
  return z.array(entitySchema).parse(value)
}
export function segmentFromDraft(
  id: string,
  properties: SegmentProperties,
  coordinates: Coordinate[]
): Segment {
  return toMapSegment(
    segmentFeatureSchema.parse({
      id,
      geometry: { type: 'LineString', coordinates },
      properties: {
        Id: id,
        UdotRouteNumber: properties.udotRouteNumber,
        Name: properties.name,
        StartMilePoint: properties.startMilePoint,
        EndMilePoint: properties.endMilePoint,
        FunctionalType: properties.functionalType,
        Direction: properties.direction,
        Polarity: properties.polarity,
        SpeedLimit: properties.speedLimit,
        Region: properties.region,
        City: properties.city,
        County: properties.county,
        AlternateIdentifier: properties.alternateIdentifier,
        AccessCategory: properties.accessCategory,
        Offset: properties.offset,
        Shape: properties.shape,
        ShapeWKT: properties.shapeWKT,
        RouteEntities: properties.entities?.map((Id) => ({ Id })),
      },
    })
  )
}
