import { configRequest } from '@/lib/axios'
import type { RouteDto } from '../config-api.schemas'
import { getRouteRouteViewFromId, upsertRouteRoute } from './route'

jest.mock('@/lib/axios', () => ({ configRequest: jest.fn() }))
beforeEach(() => jest.clearAllMocks())
const route: RouteDto = { id: 7, name: 'Main', routeLocations: [] }
it('loads the route DTO returned by the existing route-view endpoint', async () => {
  jest.mocked(configRequest).mockResolvedValue(route)
  const response: RouteDto = await getRouteRouteViewFromId(7)
  expect(response).toBe(route)
  expect(configRequest).toHaveBeenCalledWith(
    expect.objectContaining({ url: '/GetRouteView/7', method: 'GET' })
  )
})
it('sends the route ID in the existing upsert body and returns the saved DTO', async () => {
  jest.mocked(configRequest).mockResolvedValue(route)
  const saved: RouteDto = await upsertRouteRoute(route)
  expect(saved).toBe(route)
  expect(configRequest).toHaveBeenCalledWith(
    expect.objectContaining({
      url: '/UpsertRoute',
      method: 'POST',
      data: route,
    })
  )
})
