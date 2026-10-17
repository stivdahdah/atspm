import SegmentAdminPage from '@/pages/admin/segments/[id]'
import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useSegmentEditorStore } from './segmentEditorStore'
import { propertiesFromFeature, readSegment } from './segmentModel'

const mockGet = jest.fn(),
  mockUpdate = jest.fn(),
  mockCreate = jest.fn(),
  mockAttach = jest.fn(),
  mockNearby = jest.fn(),
  mockNotify = jest.fn(),
  mockPush = jest.fn()
const mockQuery = { id: 'guid-1' }
const mockSegments: unknown[] = []
const feature = {
  id: 'guid-1',
  geometry: {
    type: 'LineString',
    coordinates: [
      [-111, 40],
      [-112, 41],
    ],
  },
  properties: {
    Id: 'guid-1',
    Name: 'Main',
    UdotRouteNumber: '0015',
    FunctionalType: 'Highway',
    StartMilePoint: 0,
    EndMilePoint: 2,
    SpeedLimit: 65,
    Polarity: 'NM',
  },
}
jest.mock('next/router', () => ({
  useRouter: () => ({ query: mockQuery, push: mockPush }),
}))
jest.mock('@/api/speedManagement/aTSPMSpeedManagementApi', () => ({
  getApiV1SegmentSegmentId: (...args: unknown[]) => mockGet(...args),
  usePutApiV1SegmentUpdateSegmentSegmentId: () => ({ mutateAsync: mockUpdate }),
  usePostApiV1SegmentAddSegment: () => ({ mutateAsync: mockCreate }),
  usePostApiV1SegmentSegmentIdEntitiesReplace: () => ({
    mutateAsync: mockAttach,
  }),
  useDeleteApiV1SegmentDeleteSegmentSegmentId: () => ({
    mutateAsync: jest.fn(),
  }),
}))
jest.mock('./segmentEditorApi', () => ({
  useSegmentNearbyEntities: () => ({ mutateAsync: mockNearby }),
}))
jest.mock('@/features/speedManagementTool/api/getSegments', () => ({
  useTransformedSegments: () => ({ data: mockSegments }),
}))
jest.mock('@/features/identity/pagesCheck', () => ({
  PageNames: { Segments: 'Segments' },
  useViewPage: () => ({ isLoading: false }),
}))
jest.mock('@/stores/notifications', () => ({
  useNotificationStore: () => ({ addNotification: mockNotify }),
}))
jest.mock('@/components/GenericAdminChart', () => ({
  modalButtonLocation: {},
  modalStyle: {},
}))
jest.mock('@/components/ResponsivePage', () => ({
  ResponsivePageLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))
jest.mock('./SegmentProperties', () => () => null)
jest.mock('./DataSources', () => () => null)
jest.mock('./SegmentEditorMap/SegmentEditorMapWrapper', () => () => null)
beforeEach(() => {
  jest.clearAllMocks()
  useSegmentEditorStore.getState().reset()
  useSegmentEditorStore.getState().setAllSegments(null)
  mockQuery.id = 'guid-1'
  mockGet.mockResolvedValue({ features: [feature] })
  mockCreate.mockResolvedValue({ features: [feature] })
  mockUpdate.mockResolvedValue(undefined)
  mockAttach.mockResolvedValue(undefined)
  mockNearby.mockResolvedValue([])
  mockPush.mockResolvedValue(true)
})
async function openExisting() {
  render(<SegmentAdminPage />)
  await waitFor(() =>
    expect(useSegmentEditorStore.getState().segmentProperties.id).toBe('guid-1')
  )
  act(() => useSegmentEditorStore.getState().setActiveTab(1))
}
it('loads a string segment ID and saves with the existing update and association payloads', async () => {
  await openExisting()
  fireEvent.click(screen.getByRole('button', { name: 'save' }))
  await waitFor(() =>
    expect(mockAttach).toHaveBeenCalledWith(
      expect.objectContaining({ segmentId: 'guid-1', data: [] }),
      expect.any(Object)
    )
  )
  expect(mockUpdate).toHaveBeenCalledWith({
    segmentId: 'guid-1',
    data: expect.objectContaining({
      id: 'guid-1',
      startMilePoint: 0,
      shape: 'LINESTRING (-111 40, -112 41)',
    }),
  })
})
it('does not publish an optimistic cache update when the update request rejects', async () => {
  const silence = jest
    .spyOn(console, 'error')
    .mockImplementation(() => undefined)
  mockUpdate.mockRejectedValueOnce(new Error('offline'))
  await openExisting()
  fireEvent.click(screen.getByRole('button', { name: 'save' }))
  await waitFor(() =>
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error' })
    )
  )
  expect(mockAttach).not.toHaveBeenCalled()
  expect(useSegmentEditorStore.getState().allSegments).toEqual([])
  silence.mockRestore()
})
it('retains a created ID after association failure so retrying does not create a duplicate', async () => {
  const silence = jest
    .spyOn(console, 'error')
    .mockImplementation(() => undefined)
  mockQuery.id = 'new'
  mockAttach.mockRejectedValueOnce(new Error('offline'))
  render(<SegmentAdminPage />)
  act(() => {
    const store = useSegmentEditorStore.getState()
    store.setSegmentProperties({
      ...propertiesFromFeature(readSegment({ features: [feature] })),
      id: null,
    })
    store.setPolylineCoordinates([
      [-111, 40],
      [-112, 41],
    ])
    store.setAssociatedEntityIds(['entity-1'])
    store.setActiveTab(1)
  })
  fireEvent.click(screen.getByRole('button', { name: 'save' }))
  await waitFor(() =>
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('Retry saving'),
      })
    )
  )
  expect(useSegmentEditorStore.getState().segmentProperties.id).toBe('guid-1')
  fireEvent.click(screen.getByRole('button', { name: 'save' }))
  await waitFor(() =>
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ segmentId: 'guid-1' })
    )
  )
  expect(mockCreate).toHaveBeenCalledTimes(1)
  silence.mockRestore()
})
