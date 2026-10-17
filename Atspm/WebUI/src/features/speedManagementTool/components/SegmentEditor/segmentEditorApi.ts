import { speedRequest } from '@/lib/axios'
import { useMutation } from 'react-query'
import { readNearbyEntities, type Coordinate } from './segmentModel'

// The editor's existing request differs from the generated EntityRequestOptions.
// Keep its wire payload unchanged until the separate API contract can be verified.
export type SegmentNearbyRequest = {
  coordinates: Coordinate[]
  directions: string[]
}
export async function getSegmentNearbyEntities({
  data,
}: {
  data: SegmentNearbyRequest
}) {
  const response = await speedRequest<unknown>({
    url: '/api/v1/Entity/GetEntitiesWithinRange',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  })
  return readNearbyEntities(response)
}
export function useSegmentNearbyEntities() {
  return useMutation(getSegmentNearbyEntities)
}
