import { speedRequest } from '@/lib/axios'
import {
  fetchImpactHotspots,
  fetchMonthlyHotspots,
  getHotspotCategories,
} from './hotspotApi'
jest.mock('@/lib/axios', () => ({ speedRequest: jest.fn() }))
beforeEach(() => jest.mocked(speedRequest).mockReset())

it('preserves numeric monthly categories, date strings and existing filter payloads', async () => {
  const data = {
    category: 0,
    startTime: '2026-01-01',
    endTime: '2026-02-01',
    sourceId: [1],
    timePeriod: 'AllDay' as const,
    aggClassification: 'Weekday' as const,
    order: 'DESC',
    limit: 25,
    region: ['1'],
    differenceBetweenStartAndEndMonth: true,
  }
  jest.mocked(speedRequest).mockResolvedValueOnce({
    features: [
      {
        properties: { route_id: 'segment', averageSpeed: 0 },
        geometry: {
          coordinates: [
            [-111, 40],
            [-112, 41],
          ],
        },
      },
    ],
  })
  const result = await fetchMonthlyHotspots({ data })
  expect(speedRequest).toHaveBeenCalledWith({
    url: '/api/v1/MonthlyAggregation/hotspots',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  })
  expect(result[0].geometry?.coordinates).toEqual([
    [40, -111],
    [41, -112],
  ])
  expect(result[0].hotspotSource).toBe('monthly')
})

it('preserves the impact category and does not add monthly date or location filters', async () => {
  const data = {
    category: 'ChangeInAverageSpeed' as const,
    timePeriod: 'AllDay' as const,
    aggClassification: 'Weekday' as const,
    order: 'ASC',
    limit: 10,
  }
  jest
    .mocked(speedRequest)
    .mockResolvedValueOnce([{ id: 'impact', properties: {} }])
  expect((await fetchImpactHotspots({ data }))[0].hotspotSource).toBe('impact')
  expect(speedRequest).toHaveBeenCalledWith({
    url: '/api/v1/Impact/hotspots',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  })
})

it('loads categories with cancellation and rejects a malformed service response', async () => {
  const signal = new AbortController().signal
  jest
    .mocked(speedRequest)
    .mockResolvedValueOnce([{ number: 0, displayName: 'Average Speed' }])
  expect(await getHotspotCategories(signal)).toHaveLength(1)
  expect(speedRequest).toHaveBeenCalledWith({
    url: '/api/v1/MonthlyAggregation/speed-category-filters',
    method: 'GET',
    signal,
  })
  jest.mocked(speedRequest).mockResolvedValueOnce({ unexpected: true })
  await expect(getHotspotCategories()).rejects.toThrow()
})

it('propagates service and invalid hotspot-response failures', async () => {
  const data = {
    category: 0,
    timePeriod: 'AllDay' as const,
    aggClassification: 'Weekday' as const,
  }
  jest
    .mocked(speedRequest)
    .mockRejectedValueOnce(new Error('Service unavailable'))
  await expect(fetchMonthlyHotspots({ data })).rejects.toThrow(
    'Service unavailable'
  )
  jest.mocked(speedRequest).mockResolvedValueOnce([{ segmentId: 'bare-dto' }])
  await expect(fetchMonthlyHotspots({ data })).rejects.toThrow()
})
