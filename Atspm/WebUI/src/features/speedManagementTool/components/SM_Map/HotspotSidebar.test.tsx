import useSpeedManagementStore from '@/features/speedManagementTool/speedManagementStore'
import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import HotspotSidebar from './HotspotSidebar'
import { readHotspots } from './hotspotModel'

const mockFetchMonthlyHotspots = jest.fn()
const mockFetchImpactHotspots = jest.fn()
let mockCategoryError = false

jest.mock('./hotspotApi', () => ({
  useMonthlyHotspots: () => ({
    mutateAsync: mockFetchMonthlyHotspots,
  }),
  useImpactHotspots: () => ({
    mutateAsync: mockFetchImpactHotspots,
  }),
  useHotspotCategories: () => ({
    data: [{ number: 0, displayName: 'Average Speed' }],
    isError: mockCategoryError,
  }),
}))

jest.mock('@/features/speedManagementTool/components/SM_Map', () => ({
  SM_Height: '600px',
}))

jest.mock('@mui/x-date-pickers', () => ({
  DatePicker: ({
    label,
    onChange,
  }: {
    label: string
    onChange: (value: Date | null) => void
  }) => (
    <>
      <button onClick={() => onChange(null)}>Clear {label}</button>
      <button
        onClick={() =>
          onChange(new Date(2026, label === 'Base Month' ? 3 : 1, 1))
        }
      >
        Set {label}
      </button>
      <button onClick={() => onChange(new Date(NaN))}>
        Invalidate {label}
      </button>
    </>
  ),
}))

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: Error) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function selectEffectiveness() {
  fireEvent.mouseDown(screen.getAllByRole('combobox')[0])
  fireEvent.click(
    screen.getByRole('option', { name: 'Effectiveness of Strategies' })
  )
}

describe('HotspotSidebar request lifecycle', () => {
  beforeEach(() => {
    mockFetchMonthlyHotspots.mockReset()
    mockFetchImpactHotspots.mockReset()
    mockCategoryError = false
    useSpeedManagementStore.getState().resetToDefaults()
    useSpeedManagementStore.getState().setHotspotRoutes([])
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('does not request hotspots with a cleared comparison month', async () => {
    mockFetchMonthlyHotspots.mockResolvedValue([])
    render(<HotspotSidebar handleRouteSelection={jest.fn()} />)
    await act(async () => undefined)
    fireEvent.click(screen.getByRole('button', { name: 'compare dates' }))
    await act(async () => undefined)
    mockFetchMonthlyHotspots.mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'Clear Base Month' }))
    await act(async () => undefined)
    expect(mockFetchMonthlyHotspots).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'valid base and comparison months'
    )
  })

  it('distinguishes a failed request from an empty result', async () => {
    mockFetchMonthlyHotspots.mockRejectedValue(new Error('Service unavailable'))
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
    render(<HotspotSidebar handleRouteSelection={jest.fn()} />)
    await act(async () => undefined)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Unable to load hotspots'
    )
    expect(screen.queryByText('No hotspots found')).not.toBeInTheDocument()
  })

  it('retries failed requests and clears the error on success', async () => {
    mockFetchMonthlyHotspots
      .mockRejectedValueOnce(new Error('Unavailable'))
      .mockResolvedValueOnce([])
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
    render(<HotspotSidebar handleRouteSelection={jest.fn()} />)
    await act(async () => undefined)
    expect(mockFetchMonthlyHotspots).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await act(async () => undefined)
    expect(mockFetchMonthlyHotspots).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('No hotspots found')).toBeInTheDocument()
  })

  it('validates comparison order and sends selected calendar dates as strings', async () => {
    mockFetchMonthlyHotspots.mockResolvedValue([])
    useSpeedManagementStore.setState((state) => ({
      submittedRouteSpeedRequest: {
        ...state.submittedRouteSpeedRequest,
        startDate: '2026-01-01',
        endDate: '2026-06-01',
      },
    }))
    render(<HotspotSidebar handleRouteSelection={jest.fn()} />)
    await act(async () => undefined)
    fireEvent.click(screen.getByRole('button', { name: 'compare dates' }))
    await act(async () => undefined)
    fireEvent.click(screen.getByRole('button', { name: 'Set Base Month' }))
    await act(async () => undefined)
    expect(mockFetchMonthlyHotspots).toHaveBeenLastCalledWith({
      data: expect.objectContaining({
        category: 0,
        startTime: '2026-04-01',
        endTime: '2026-06-01',
        differenceBetweenStartAndEndMonth: true,
      }),
    })
    mockFetchMonthlyHotspots.mockClear()
    fireEvent.click(
      screen.getByRole('button', { name: 'Set Comparison Month' })
    )
    await act(async () => undefined)
    expect(mockFetchMonthlyHotspots).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'on or after the base month'
    )
  })

  it('blocks invalid dates while allowing impact ranking independent of the date controls', async () => {
    mockFetchMonthlyHotspots.mockResolvedValue([])
    mockFetchImpactHotspots.mockResolvedValue([])
    render(<HotspotSidebar handleRouteSelection={jest.fn()} />)
    await act(async () => undefined)
    fireEvent.click(screen.getByRole('button', { name: 'compare dates' }))
    await act(async () => undefined)
    mockFetchMonthlyHotspots.mockClear()
    fireEvent.click(
      screen.getByRole('button', { name: 'Invalidate Base Month' })
    )
    await act(async () => undefined)
    expect(mockFetchMonthlyHotspots).not.toHaveBeenCalled()
    selectEffectiveness()
    await act(async () => undefined)
    expect(mockFetchImpactHotspots).toHaveBeenCalledWith({
      data: expect.objectContaining({ category: 'ChangeInAverageSpeed' }),
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('reports unavailable ranking options', async () => {
    mockCategoryError = true
    mockFetchMonthlyHotspots.mockResolvedValue([])
    render(<HotspotSidebar handleRouteSelection={jest.fn()} />)
    await act(async () => undefined)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Unable to load hotspot ranking options'
    )
  })

  it.each(['empty response', 'error'])(
    'keeps Effectiveness loading when the previous request finishes with an %s',
    async (completion) => {
      const monthly = deferred<unknown[]>()
      const impact = deferred<unknown[]>()
      mockFetchMonthlyHotspots.mockReturnValue(monthly.promise)
      mockFetchImpactHotspots.mockReturnValue(impact.promise)
      jest.spyOn(console, 'error').mockImplementation(() => undefined)

      render(<HotspotSidebar handleRouteSelection={jest.fn()} />)
      selectEffectiveness()
      expect(mockFetchImpactHotspots).toHaveBeenCalledTimes(1)
      expect(screen.queryByText('No hotspots found')).not.toBeInTheDocument()

      await act(async () => {
        if (completion === 'error')
          monthly.reject(new Error('Older request failed'))
        else monthly.resolve([])
      })

      expect(screen.queryByText('No hotspots found')).not.toBeInTheDocument()
      expect(screen.getByRole('table')).toBeInTheDocument()

      await act(async () => impact.resolve([]))
      expect(screen.getByRole('status')).toHaveTextContent('No hotspots found')
    }
  )

  it('ignores a response after the sidebar unmounts', async () => {
    const monthly = deferred<unknown[]>()
    mockFetchMonthlyHotspots.mockReturnValue(monthly.promise)

    const { unmount } = render(
      <HotspotSidebar handleRouteSelection={jest.fn()} />
    )
    unmount()
    await act(async () => monthly.resolve([{ id: 'stale-hotspot' }]))

    expect(useSpeedManagementStore.getState().hotspotRoutes).toEqual([])
  })

  it('keeps the current results when an older request finishes afterward', async () => {
    const monthly = deferred<unknown[]>()
    const impact = deferred<unknown[]>()
    const impactFeature = readHotspots(
      [{ id: 'impact-1', properties: { speedLimit: 55 } }],
      'impact'
    )[0]
    mockFetchMonthlyHotspots.mockReturnValue(monthly.promise)
    mockFetchImpactHotspots.mockReturnValue(impact.promise)

    render(<HotspotSidebar handleRouteSelection={jest.fn()} />)
    selectEffectiveness()
    await act(async () => impact.resolve([impactFeature]))
    await act(async () => monthly.resolve([]))

    expect(useSpeedManagementStore.getState().hotspotRoutes).toEqual([
      expect.objectContaining({ id: 'impact-1', hotspotSource: 'impact' }),
    ])
    expect(screen.queryByText('No hotspots found')).not.toBeInTheDocument()
  })
})
