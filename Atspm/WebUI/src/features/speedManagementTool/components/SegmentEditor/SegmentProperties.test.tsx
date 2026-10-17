import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createRef } from 'react'
import SegmentProperties, {
  type SegmentPropertiesHandle,
} from './SegmentProperties'
import { useSegmentEditorStore } from './segmentEditorStore'
jest.mock('@/api/speedManagement/aTSPMSpeedManagementApi', () => ({
  useGetApiV1AccessCategory: () => ({ data: [] }),
  useGetApiV1City: () => ({ data: [] }),
  useGetApiV1County: () => ({ data: [] }),
  useGetApiV1FunctionalType: () => ({ data: [] }),
  useGetApiV1Region: () => ({ data: [] }),
}))
beforeEach(() => useSegmentEditorStore.getState().reset())
it('keeps blank numeric values invalid, while accepting a real zero mile point', async () => {
  const ref = createRef<SegmentPropertiesHandle>()
  render(<SegmentProperties ref={ref} />)
  fireEvent.change(screen.getByLabelText(/Start Mile Point/), {
    target: { value: '' },
  })
  let valid = true
  const form = ref.current
  if (!form) throw new Error('Missing form ref')
  await act(async () => {
    valid = await form.submitForm()
  })
  expect(valid).toBe(false)
  expect(
    (screen.getByLabelText(/Start Mile Point/) as HTMLInputElement).value
  ).toBe('')
  fireEvent.change(screen.getByLabelText(/Start Mile Point/), {
    target: { value: '0' },
  })
  expect(
    (screen.getByLabelText(/Start Mile Point/) as HTMLInputElement).value
  ).toBe('0')
})
it('hydrates an asynchronously loaded segment and preserves its NM polarity', async () => {
  render(<SegmentProperties />)
  act(() =>
    useSegmentEditorStore
      .getState()
      .updateSegmentProperties({
        id: 'guid-2',
        name: 'Loaded segment',
        polarity: 'NM',
      })
  )
  await waitFor(() =>
    expect((screen.getByLabelText(/Name/) as HTMLInputElement).value).toBe(
      'Loaded segment'
    )
  )
  expect(
    screen.getByRole('combobox', { name: 'Polarity' }).textContent
  ).toContain('NM')
  fireEvent.change(screen.getByLabelText(/Name/), {
    target: { value: 'Unsaved name' },
  })
  act(() =>
    useSegmentEditorStore.getState().setPolylineCoordinates([
      [-111, 40],
      [-112, 41],
    ])
  )
  expect((screen.getByLabelText(/Name/) as HTMLInputElement).value).toBe(
    'Unsaved name'
  )
})
