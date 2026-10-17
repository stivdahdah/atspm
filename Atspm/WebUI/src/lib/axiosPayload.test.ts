import axios from 'axios'
import Cookies from 'js-cookie'
import { initializeAxiosInstances, speedAxios, speedRequest } from './axios'
it('unwraps payloads once and reads the current auth token for every request', async () => {
  await initializeAxiosInstances({
    SPEED_URL: 'https://example.test/speed',
    CONFIG_URL: undefined,
    REPORTS_URL: undefined,
    IDENTITY_URL: undefined,
    DATA_URL: undefined,
    MAP_DEFAULT_LATITUDE: undefined,
    MAP_DEFAULT_LONGITUDE: undefined,
    MAP_DEFAULT_ZOOM: undefined,
    MAP_TILE_LAYER: undefined,
    MAP_TILE_ATTRIBUTION: undefined,
    POWERED_BY_IMAGE_URL: undefined,
    SPEED_LIMIT_MAP_LAYER: undefined,
  })
  const headers: unknown[] = []
  speedAxios.defaults.adapter = async (config) => {
    headers.push(config.headers.authorization)
    return {
      data: { value: 0 },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }
  }
  Cookies.set('token', 'first')
  expect(await speedRequest({ url: '/api/v1/report' })).toEqual({ value: 0 })
  Cookies.set('token', 'second')
  expect(await speedRequest({ url: '/api/v1/report' })).toEqual({ value: 0 })
  expect(headers).toEqual(['Bearer first', 'Bearer second'])
  Cookies.remove('token')
})
it('preserves HTTP failures for the caller', async () => {
  speedAxios.defaults.adapter = async () => {
    throw new axios.AxiosError('Request failed')
  }
  await expect(speedRequest({ url: '/api/v1/report' })).rejects.toThrow(
    'Request failed'
  )
})
