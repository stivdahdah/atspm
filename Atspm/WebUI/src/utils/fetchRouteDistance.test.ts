import axios from 'axios'
import { fetchRouteDistance } from './fetchRouteDistance'

jest.mock('axios')
const get = jest.mocked(axios.get)
beforeEach(() => jest.clearAllMocks())
it('rejects incomplete route coordinates before calling the routing service', async () => {
  await expect(fetchRouteDistance([])).rejects.toThrow('valid coordinates')
  await expect(
    fetchRouteDistance([{ latitude: 0, longitude: 0 }, {}])
  ).rejects.toThrow('valid coordinates')
  expect(get).not.toHaveBeenCalled()
})
it('accepts zero coordinates, converts meters to feet and flips geometry for the map', async () => {
  get.mockResolvedValueOnce({
    data: {
      matchings: [
        {
          distance: 10,
          geometry: {
            coordinates: [
              [0, 0],
              [1, 2],
            ],
          },
        },
      ],
    },
  })
  const result = await fetchRouteDistance([
    { longitude: 0, latitude: 0 },
    { longitude: 1, latitude: 2 },
  ])
  expect(result).toEqual({
    distance: 32.8084,
    shape: [
      [0, 0],
      [2, 1],
    ],
  })
  expect(get).toHaveBeenCalledWith(
    expect.stringContaining('/match/v1/driving/0,0;1,2?')
  )
})
it('falls back to the route endpoint if matching is unavailable', async () => {
  const silence = jest
    .spyOn(console, 'warn')
    .mockImplementation(() => undefined)
  get
    .mockRejectedValueOnce(new Error('no match'))
    .mockResolvedValueOnce({
      data: { routes: [{ distance: 0, geometry: { coordinates: [[0, 0]] } }] },
    })
  await expect(
    fetchRouteDistance([
      { longitude: 0, latitude: 0 },
      { longitude: 1, latitude: 2 },
    ])
  ).resolves.toEqual({ distance: 0, shape: [[0, 0]] })
  expect(get).toHaveBeenLastCalledWith(
    expect.stringContaining('/route/v1/driving/')
  )
  silence.mockRestore()
})
