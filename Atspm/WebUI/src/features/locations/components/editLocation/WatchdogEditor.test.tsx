import type { WatchdogIgnoreEventResponse } from '@/features/watchdog/api/watchdogIgnoreEvents'
import '@testing-library/jest-dom'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import WatchdogEditor from './WatchdogEditor'

let mockEvents: WatchdogIgnoreEventResponse[] = []
const mockCreate = jest.fn()
const mockEdit = jest.fn()
const mockDelete = jest.fn()
const mockNotify = jest.fn()
const mockRefetch = jest.fn()
jest.mock('./locationStore', () => ({
  useLocationStore: () => ({ location: { id: 5, locationIdentifier: '001' } }),
}))
jest.mock('@/hooks/useConfigEnums', () => ({
  ConfigEnum: { WatchDogIssueTypes: 'WatchDogIssueTypes' },
  useConfigEnums: () => ({ data: [{ name: 'RecordCount', value: 1 }] }),
}))
jest.mock('@/features/watchdog/api/watchdogIgnoreEvents', () => ({
  useGetWatchdogIgnoreEvents: () => ({
    data: { value: mockEvents },
    refetch: mockRefetch,
  }),
  useCreateWatchdogIgnoreEvents: () => ({ mutateAsync: mockCreate }),
  useEditWatchdogIgnoreEvents: () => ({ mutateAsync: mockEdit }),
  useDeleteWatchdogIgnoreEvents: () => ({ mutateAsync: mockDelete }),
}))
jest.mock('@/stores/notifications', () => ({
  useNotificationStore: () => ({ addNotification: mockNotify }),
}))
jest.mock('./WatchDogDatePopup', () => ({
  __esModule: true,
  default: (props: {
    open: boolean
    handleIgnoreEvent: () => void
    handleRemoveIgnore: () => void
    setEndDate: (date: Date) => void
  }) =>
    props.open ? (
      <div>
        <button onClick={props.handleIgnoreEvent}>Save ignore</button>
        <button onClick={props.handleRemoveIgnore}>Remove ignore</button>
        <button onClick={() => props.setEndDate(new Date('2000-01-01'))}>
          Invalid range
        </button>
      </div>
    ) : null,
}))
function recordButton() {
  const row = screen.getByText('Record Count').parentElement?.parentElement
  if (!row) throw new Error('Missing Record Count row')
  return within(row).getByRole('button')
}
beforeEach(() => {
  jest.clearAllMocks()
  mockEvents = []
  for (const fn of [mockCreate, mockEdit, mockDelete, mockRefetch])
    fn.mockResolvedValue({})
})
it.each([1, 'RecordCount'] as const)(
  'matches existing numeric or named issue types (%s) and edits the existing record',
  async (issueType) => {
    mockEvents = [
      {
        id: 9,
        locationIdentifier: '001',
        issueType,
        start: '2026-01-01',
        end: '2026-01-02',
      },
    ]
    render(<WatchdogEditor hasEditPermission />)
    expect(recordButton()).toHaveTextContent('Inactive from')
    fireEvent.click(recordButton())
    fireEvent.click(screen.getByRole('button', { name: 'Save ignore' }))
    await waitFor(() =>
      expect(mockEdit).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 9,
          data: expect.objectContaining({
            issueType: 'RecordCount',
            locationId: 5,
          }),
        })
      )
    )
    expect(mockCreate).not.toHaveBeenCalled()
  }
)
it('creates a new ignore record through the existing named-enum payload', async () => {
  render(<WatchdogEditor hasEditPermission />)
  fireEvent.click(recordButton())
  fireEvent.click(screen.getByRole('button', { name: 'Save ignore' }))
  await waitFor(() =>
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ issueType: 'RecordCount', locationId: 5 })
    )
  )
})
it('renders incomplete saved dates safely and blocks invalid ranges', async () => {
  mockEvents = [{ id: 9, locationIdentifier: '001', issueType: 'RecordCount' }]
  render(<WatchdogEditor hasEditPermission />)
  expect(recordButton()).toHaveTextContent('date unavailable')
  fireEvent.click(recordButton())
  fireEvent.click(screen.getByRole('button', { name: 'Save ignore' }))
  expect(mockEdit).not.toHaveBeenCalled()
  expect(mockNotify).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'error' })
  )
})
it('reports failed saves and leaves the editor open', async () => {
  mockCreate.mockRejectedValueOnce(new Error('offline'))
  render(<WatchdogEditor hasEditPermission />)
  fireEvent.click(recordButton())
  fireEvent.click(screen.getByRole('button', { name: 'Save ignore' }))
  await waitFor(() =>
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error' })
    )
  )
  expect(
    screen.getByRole('button', { name: 'Save ignore' })
  ).toBeInTheDocument()
})
it('keeps edit controls disabled without edit permission', () => {
  render(<WatchdogEditor hasEditPermission={false} />)
  expect(recordButton()).toBeDisabled()
})
