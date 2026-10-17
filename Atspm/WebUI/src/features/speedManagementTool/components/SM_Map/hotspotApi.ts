import type {
  ImpactAggregationOptions,
  MonthlyAggregationOptions,
} from '@/api/speedManagement/aTSPMSpeedManagementApi.schemas'
import { speedRequest } from '@/lib/axios'
import { useMutation, useQuery } from 'react-query'
import { readHotspotCategories, readHotspots } from './hotspotModel'

// Preserve the existing hotspot wire requests until the separate service can
// be verified: monthly categories are numeric and exclusion flags were absent.
export type MonthlyHotspotRequest = Pick<
  MonthlyAggregationOptions,
  | 'accessCategory'
  | 'aggClassification'
  | 'city'
  | 'county'
  | 'differenceBetweenStartAndEndMonth'
  | 'endTime'
  | 'functionalType'
  | 'limit'
  | 'order'
  | 'region'
  | 'sourceId'
  | 'startTime'
  | 'timePeriod'
> & { category: number }
export type ImpactHotspotRequest = Pick<
  ImpactAggregationOptions,
  'category' | 'timePeriod' | 'aggClassification' | 'order' | 'limit'
>

export async function getHotspotCategories(signal?: AbortSignal) {
  return readHotspotCategories(
    await speedRequest<unknown>({
      url: '/api/v1/MonthlyAggregation/speed-category-filters',
      method: 'GET',
      signal,
    })
  )
}
export async function fetchMonthlyHotspots({
  data,
}: {
  data: MonthlyHotspotRequest
}) {
  return readHotspots(
    await speedRequest<unknown>({
      url: '/api/v1/MonthlyAggregation/hotspots',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data,
    }),
    'monthly'
  )
}
export async function fetchImpactHotspots({
  data,
}: {
  data: ImpactHotspotRequest
}) {
  return readHotspots(
    await speedRequest<unknown>({
      url: '/api/v1/Impact/hotspots',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data,
    }),
    'impact'
  )
}
export function useHotspotCategories() {
  return useQuery(['hotspot-category-filters'], ({ signal }) =>
    getHotspotCategories(signal)
  )
}
export function useMonthlyHotspots() {
  return useMutation(fetchMonthlyHotspots)
}
export function useImpactHotspots() {
  return useMutation(fetchImpactHotspots)
}
