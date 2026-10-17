import type { SearchLocation } from '@/api/config'
export type MapLocation = SearchLocation & {
  id: number
  latitude: number
  longitude: number
}
export function isMapLocation(
  location: SearchLocation
): location is MapLocation {
  return (
    typeof location.id === 'number' &&
    Number.isFinite(location.id) &&
    typeof location.latitude === 'number' &&
    Number.isFinite(location.latitude) &&
    Math.abs(location.latitude) <= 90 &&
    typeof location.longitude === 'number' &&
    Number.isFinite(location.longitude) &&
    Math.abs(location.longitude) <= 180
  )
}
