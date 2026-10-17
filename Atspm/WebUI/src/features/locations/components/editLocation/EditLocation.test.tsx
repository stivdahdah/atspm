import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react'
import EditLocation from './EditLocation'
import { useLocationStore } from './locationStore'
import { readConfigLocation } from './editorModel'

const mockPatchLocation = jest.fn()
const mockPatchApproach = jest.fn()
const mockNotify = jest.fn()
jest.mock('@/api/config', () => ({ ...jest.requireActual('@/api/config'),
  usePatchLocationFromKey: () => ({ mutateAsync: mockPatchLocation }),
  usePatchApproachFromKey: () => ({ mutateAsync: mockPatchApproach }),
}))
jest.mock('@/features/identity/pagesCheck', () => ({ useUserHasClaim: () => true }))
jest.mock('@/hooks/useUnsavedGuard', () => ({ useUnsavedGuard: () => ({ allowNavigate: async () => true, Prompt: () => null }) }))
jest.mock('@/stores/notifications', () => ({ useNotificationStore: (select: (state: unknown) => unknown) => select({ addNotification: mockNotify }) }))
jest.mock('./EditLocationHeader', () => () => null)
jest.mock('./LocationGeneralOptionsEditor', () => () => null)
jest.mock('./EditDevices', () => () => null)
jest.mock('./WatchdogEditor', () => () => null)
jest.mock('../editApproach/EditApproach', () => () => null)
jest.mock('../ApproachesInfo/approachesInfo', () => () => null)
jest.mock('../DetectorsInfo/detectorsInfo', () => () => null)

beforeEach(() => {
  jest.clearAllMocks()
  useLocationStore.getState().setLocation(readConfigLocation({ id: 1, start: '2026-01-01', pedsAre1to1: false,
    approaches: [{ id: 2, protectedPhaseNumber: 2 }] }))
  useLocationStore.getState().updateApproaches(useLocationStore.getState().approaches.map(a => ({ ...a, protectedPhaseNumber: '4' })))
  mockPatchLocation.mockResolvedValue({})
  mockPatchApproach.mockResolvedValue({})
})
afterEach(() => cleanup())
async function lockPhases() {
  render(<EditLocation />)
  fireEvent.click(screen.getByRole('tab', { name: 'Approaches' }))
  await screen.findByText('Pedestrian Phases 1:1')
  fireEvent.click(screen.getByRole('checkbox', { name: 'Pedestrian Phases 1:1' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Lock' }))
}
it('persists numeric pedestrian phases and retains unrelated unsaved approach edits', async () => {
  await lockPhases()
  await waitFor(() => expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' })))
  expect(mockPatchApproach).toHaveBeenCalledWith({ key: 2, data: { pedestrianPhaseNumber: 4, pedestrianDetectors: '4' } })
  expect(useLocationStore.getState().location?.pedsAre1to1).toBe(true)
  expect(useLocationStore.getState().hasUnsavedChanges()).toBe(true)
  expect(useLocationStore.getState().savedApproaches[0].protectedPhaseNumber).toBe(2)
  expect(useLocationStore.getState().savedApproaches[0].pedestrianPhaseNumber).toBe(4)
})
it('does not mark the draft saved when the server rejects the change', async () => {
  mockPatchLocation.mockRejectedValueOnce(new Error('offline'))
  await lockPhases()
  await waitFor(() => expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' })))
  expect(useLocationStore.getState().location?.pedsAre1to1).toBe(false)
  expect(useLocationStore.getState().hasUnsavedChanges()).toBe(true)
  expect(mockPatchApproach).not.toHaveBeenCalled()
})
