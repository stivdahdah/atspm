import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import axios from 'axios'
import { useEditImpact } from './editImpacts'
import { usePostImpacts } from './postImpacts'
import type { Impact } from '../types/impact'

jest.mock('axios', () => ({ __esModule: true, default: { put: jest.fn(), post: jest.fn() } }))
jest.mock('@/utils/getEnv', () => ({ getEnv: jest.fn(async () => ({ SPEED_URL: 'https://speed.example/' })) }))
jest.mock('js-cookie', () => ({ __esModule: true, default: { get: jest.fn(() => 'test-token') } }))
jest.mock('@/stores/notifications', () => ({ useNotificationStore: () => ({ addNotification: jest.fn() }) }))

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

const impact: Impact = { startMile: 1, endMile: 2 }

beforeEach(() => jest.clearAllMocks())

it('preserves the impact ID and body and delivers mutation variables to edit callbacks', async () => {
  const saved = { ...impact, id: 'impact-1' }
  jest.mocked(axios.put).mockResolvedValue({ data: saved })
  const onSuccess = jest.fn()
  const { result } = renderHook(() => useEditImpact({ onSuccess }), { wrapper: createWrapper() })
  const variables = { impactId: 'impact-1', impactData: impact }
  await act(async () => { await result.current.mutateAsync(variables) })
  expect(axios.put).toHaveBeenCalledWith('https://speed.example/api/v1/impact/impact-1', impact, {
    headers: { Authorization: 'Bearer test-token' },
  })
  expect(onSuccess).toHaveBeenCalledWith(saved, variables, undefined)
})

it('keeps creation callbacks and returned impact data compatible', async () => {
  const saved = { ...impact, id: 'impact-2' }
  jest.mocked(axios.post).mockResolvedValue({ data: saved })
  const onSuccess = jest.fn()
  const { result } = renderHook(() => usePostImpacts({ onSuccess }), { wrapper: createWrapper() })
  await act(async () => { expect(await result.current.mutateAsync(impact)).toEqual(saved) })
  expect(onSuccess).toHaveBeenCalledWith(saved, impact, undefined)
})
