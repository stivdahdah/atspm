import type { Location } from '@/api/config'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useLocationConfigHandler } from './editLocationConfigHandler'

const mockGet = jest.fn()
const mockRefetch = jest.fn()
let mockData: { value: Location[] } | undefined
jest.mock('@/api/config', () => ({
  ...jest.requireActual('@/api/config'),
  useGetLocationFromKey: (...args: unknown[]) => {
    mockGet(...args)
    return { data: mockData, refetch: mockRefetch }
  },
}))
beforeEach(() => {
  jest.clearAllMocks()
  mockData = undefined
})
it('disables loading without a selected numeric ID and clears the old draft', async () => {
  const selected = { id: 5 }
  mockData = {
    value: [{ id: 5, approaches: [{ id: 9, protectedPhaseNumber: 2 }] }],
  }
  const { result, rerender } = renderHook(
    ({ location }: { location: { id: number } | null }) =>
      useLocationConfigHandler({ location }),
    {
      initialProps: { location: selected } as {
        location: { id: number } | null
      },
    }
  )
  await waitFor(() => expect(result.current.approaches).toHaveLength(1))
  mockData = undefined
  rerender({ location: null })
  await waitFor(() => expect(result.current.expandedLocation).toBeNull())
  expect(result.current.approaches).toEqual([])
  expect(mockGet).toHaveBeenLastCalledWith(0, expect.any(Object), {
    query: { enabled: false },
  })
})
it('initializes new approaches as drafts with blank phases and initialized detectors', async () => {
  mockData = { value: [{ id: 5 }] }
  const { result } = renderHook(() =>
    useLocationConfigHandler({ location: { id: 5 } })
  )
  await waitFor(() => expect(result.current.expandedLocation?.id).toBe(5))
  act(() => result.current.handleAddNewApproach())
  expect(result.current.approaches[0]).toMatchObject({
    isNew: true,
    protectedPhaseNumber: null,
    directionTypeId: 'NA',
    detectors: [],
    locationId: 5,
  })
})
