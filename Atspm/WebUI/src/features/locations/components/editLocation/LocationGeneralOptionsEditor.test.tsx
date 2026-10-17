import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import LocationGeneralOptionsEditor from './LocationGeneralOptionsEditor'
import { readConfigLocation } from './editorModel'

const mockSave = jest.fn()
const mockReload = jest.fn()
const mockSetLocation = jest.fn()
const mockNotify = jest.fn()
const mockInvalidate = jest.fn()
let mockLocation = readConfigLocation({
  id: 5,
  latitude: 0,
  longitude: 0,
  start: '2026-01-01T00:00:00',
})

jest.mock('@/api/config', () => ({
  useGetArea: () => ({}),
  useGetJurisdiction: () => ({}),
  useGetLocationType: () => ({}),
  useGetRegion: () => ({}),
  usePutLocationFromKey: () => ({ mutateAsync: mockSave }),
}))
jest.mock('./locationStore', () => ({
  useLocationStore: () => ({
    location: mockLocation,
    handleLocationEdit: jest.fn(),
    setLocation: mockSetLocation,
  }),
}))
jest.mock('@/stores/notifications', () => ({
  useNotificationStore: () => ({ addNotification: mockNotify }),
}))
jest.mock('@/pages/admin/locations/[[...id]]', () => ({
  getLocation: (...args: unknown[]) => mockReload(...args),
}))
jest.mock('react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidate }),
}))
jest.mock('@/components/AuditInfo', () => () => null)
jest.mock('@/components/customSelect', () => () => null)
jest.mock('./LocationCoordinatesPicker', () => () => null)
jest.mock('@mui/x-date-pickers', () => ({ DatePicker: () => null }))

beforeEach(() => {
  jest.clearAllMocks()
  mockLocation = readConfigLocation({
    id: 5,
    latitude: 0,
    longitude: 0,
    start: '2026-01-01T00:00:00',
  })
  mockReload.mockResolvedValue(mockLocation)
  mockInvalidate.mockResolvedValue(undefined)
})
it('waits for persistence and reload before announcing a successful save', async () => {
  let finish: () => void = () => undefined
  mockSave.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve
      })
  )
  render(<LocationGeneralOptionsEditor />)
  fireEvent.click(screen.getByRole('button', { name: 'Save General Info' }))
  expect(mockSave).toHaveBeenCalledWith(
    expect.objectContaining({
      key: 5,
      data: expect.objectContaining({ latitude: 0, longitude: 0 }),
    })
  )
  expect(mockNotify).not.toHaveBeenCalled()
  expect(mockReload).not.toHaveBeenCalled()
  finish()
  await waitFor(() =>
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success' })
    )
  )
  expect(mockReload).toHaveBeenCalledWith(5)
  expect(mockSetLocation).toHaveBeenCalledWith(mockLocation)
})
it('keeps the draft and reports failure when persistence rejects', async () => {
  const silence = jest
    .spyOn(console, 'error')
    .mockImplementation(() => undefined)
  mockSave.mockRejectedValueOnce(new Error('offline'))
  render(<LocationGeneralOptionsEditor />)
  fireEvent.click(screen.getByRole('button', { name: 'Save General Info' }))
  await waitFor(() =>
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error' })
    )
  )
  expect(mockReload).not.toHaveBeenCalled()
  expect(mockSetLocation).not.toHaveBeenCalled()
  silence.mockRestore()
})
