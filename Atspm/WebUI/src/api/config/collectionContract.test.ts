import { configRequest } from '@/lib/axios'
import { getLocationCount, getLocationLatestVersionOfAllLocations } from './location/location'
import type { Location, ODataCollection } from './config-api.schemas'

jest.mock('@/lib/axios', () => ({ configRequest: jest.fn() }))

beforeEach(() => jest.clearAllMocks())

it('preserves the OData collection envelope and pagination metadata', async () => {
  const payload: ODataCollection<Location> = {
    value: [{ id: 12, locationIdentifier: '12' }],
    '@odata.count': 2,
    '@odata.nextLink': '/Location?$skip=1',
  }
  jest.mocked(configRequest).mockResolvedValue(payload)
  const result: ODataCollection<Location> = await getLocationLatestVersionOfAllLocations({ top: 1 })
  expect(result).toBe(payload)
  expect(result.value[0].id).toBe(12)
  expect(configRequest).toHaveBeenCalledWith(expect.objectContaining({
    url: '/Location/GetLatestVersionOfAllLocations', method: 'GET', params: { top: 1 },
  }))
})

it('returns a numeric count instead of an entity collection', async () => {
  jest.mocked(configRequest).mockResolvedValue(2)
  const count: number = await getLocationCount()
  expect(count).toBe(2)
  expect(configRequest).toHaveBeenCalledWith(expect.objectContaining({
    url: '/Location/$count', method: 'GET',
  }))
})
