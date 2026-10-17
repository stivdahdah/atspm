import { z } from 'zod'

const coordinate = z
  .tuple([z.number().finite(), z.number().finite()])
  .rest(z.number().finite())
const lineGeometry = z
  .object({
    type: z.literal('LineString').optional(),
    coordinates: z.array(coordinate),
  })
  .passthrough()
const geometry = z.union([
  lineGeometry,
  z
    .object({
      type: z.literal('GeometryCollection').optional(),
      geometries: z.array(lineGeometry),
    })
    .passthrough(),
])
const properties = z
  .object({
    route_id: z
      .string()
      .nullish()
      .transform((value) => value ?? undefined),
    segmentId: z
      .string()
      .nullish()
      .transform((value) => value ?? undefined),
    segmentIds: z.array(z.string()).nullish(),
    name: z
      .string()
      .nullish()
      .transform((value) => value ?? undefined),
    binStartTime: z.string().nullish(),
  })
  .passthrough()
const feature = z
  .object({
    id: z
      .string()
      .nullish()
      .transform((value) => value ?? undefined),
    segmentId: z
      .string()
      .nullish()
      .transform((value) => value ?? undefined),
    segmentIds: z.array(z.string()).nullish(),
    properties,
    geometry: geometry.nullish(),
  })
  .passthrough()

export type HotspotCoordinate = [number, number]
export type HotspotSource = 'impact' | 'monthly'
export interface HotspotFeature {
  id?: string
  segmentId?: string
  segmentIds?: string[] | null
  properties: z.infer<typeof properties>
  geometry?: {
    coordinates?: HotspotCoordinate[]
    geometries?: Array<{ coordinates: HotspotCoordinate[] }>
  }
  hotspotSource: HotspotSource
  [key: string]: unknown
}

// These are the GeoJSON feature shapes consumed by the existing UI, not the
// bare DTO arrays declared by the separate service's generated client.
export function readHotspots(
  value: unknown,
  source: HotspotSource
): HotspotFeature[] {
  const rows = z
    .union([
      z.array(feature),
      z
        .object({ features: z.array(feature) })
        .transform((collection) => collection.features),
    ])
    .parse(value ?? [])
  const flip = ([lng, lat]: number[]): HotspotCoordinate => [lat, lng]
  return rows.map((row) => ({
    ...row,
    hotspotSource: source,
    geometry: row.geometry
      ? {
          ...row.geometry,
          coordinates:
            'coordinates' in row.geometry &&
            Array.isArray(row.geometry.coordinates)
              ? z.array(coordinate).parse(row.geometry.coordinates).map(flip)
              : undefined,
          geometries:
            'geometries' in row.geometry &&
            Array.isArray(row.geometry.geometries)
              ? z
                  .array(lineGeometry)
                  .parse(row.geometry.geometries)
                  .map((line) => ({
                    ...line,
                    coordinates: line.coordinates.map(flip),
                  }))
              : undefined,
        }
      : undefined,
  }))
}

const categoryFilter = z.object({
  number: z
    .number()
    .int()
    .nonnegative()
    .refine((value) => value !== 100),
  displayName: z.string().trim().min(1),
})
export function readHotspotCategories(value: unknown) {
  return z.array(categoryFilter).parse(value)
}

export function getHotspotRouteId(hotspot: HotspotFeature): string | null {
  const ids = hotspot.properties.segmentIds ?? hotspot.segmentIds
  return (
    hotspot.properties.route_id ||
    hotspot.properties.segmentId ||
    hotspot.segmentId ||
    (ids?.length ? ids[Math.floor(ids.length / 2)] : null)
  )
}

export function getHotspotCoordinates(
  hotspot: HotspotFeature
): HotspotCoordinate[] {
  return (
    hotspot.geometry?.geometries?.flatMap((line) => line.coordinates) ??
    hotspot.geometry?.coordinates ??
    []
  )
}
