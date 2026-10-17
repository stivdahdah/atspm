import ActiveTransportation from '@/pages/reports/pedestrian-activity'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const mockFetch = jest.fn()
const mockSetQs = jest.fn()
const mockQs = {
  locations: ['001'],
  timeUnit: 999,
  start: new Date('2026-01-01T00:00:00'),
  end: new Date('2026-01-02T00:00:00'),
  phase: 'All',
}
jest.mock('@/api/config', () => ({
  getLocation: async () => ({
    value: [
      {
        id: 5,
        locationIdentifier: '001',
        pedsAre1to1: true,
        approaches: [{ protectedPhaseNumber: 2 }],
      },
    ],
  }),
}))
jest.mock('@/api/reports', () => ({
  PedestrianTimeUnit: {
    NUMBER_0: 0,
    NUMBER_1: 1,
    NUMBER_2: 2,
    NUMBER_3: 3,
    NUMBER_4: 4,
  },
  useGetPedestrianAggregationLocationData: () => ({ mutateAsync: mockFetch }),
}))
jest.mock('nuqs', () => ({
  createParser: (value: object) => ({ ...value, withDefault: () => value }),
  parseAsArrayOf: () => ({ withDefault: () => [] }),
  parseAsString: {},
  parseAsInteger: { withDefault: () => 0 },
  useQueryStates: () => [mockQs, mockSetQs],
}))
jest.mock('@/components/ResponsivePage', () => ({
  ResponsivePageLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))
jest.mock('@/components/RightSidebar', () => () => null)
jest.mock(
  '@/features/activeTransportation/components/PedestrianActivityInfoPanel',
  () => () => null
)
jest.mock(
  '@/features/activeTransportation/components/ActiveTransportationOptions',
  () => ({
    ActiveTransportationOptions: (props: {
      locations: unknown[]
      timeUnit: number
      setPhase: (phase: number) => void
    }) => (
      <div>
        <span data-testid="selection">
          {JSON.stringify({
            locations: props.locations,
            timeUnit: props.timeUnit,
          })}
        </span>
        <button onClick={() => props.setPhase(2)}>Phase 2</button>
      </div>
    ),
  })
)
jest.mock(
  '@/features/activeTransportation/components/PedatChartsContainer',
  () =>
    function MockPedatChartsContainer(props: {
      data: unknown[]
      phase: string
    }) {
      return <div data-testid="result">{JSON.stringify(props)}</div>
    }
)
beforeEach(() => {
  jest.clearAllMocks()
  mockFetch.mockResolvedValue([
    {
      locationIdentifier: '001',
      totalVolume: 2.7,
      averageVolumeByHourOfDay: null,
    },
  ])
  mockSetQs.mockResolvedValue(undefined)
})
it('hydrates numeric location IDs, normalizes URL time units, and sends All as a nullable API phase', async () => {
  render(<ActiveTransportation />)
  await waitFor(() =>
    expect(screen.getByTestId('selection').textContent).toContain('"id":5')
  )
  fireEvent.click(screen.getByRole('button', { name: 'Generate Report' }))
  await waitFor(() =>
    expect(mockFetch).toHaveBeenCalledWith({
      data: expect.objectContaining({
        locationIdentifiers: ['001'],
        timeUnit: 0,
        phase: null,
      }),
    })
  )
  await waitFor(() =>
    expect(screen.getByTestId('result').textContent).toContain(
      '"totalVolume":3'
    )
  )
  expect(screen.getByTestId('result').textContent).toContain('"phase":"All"')
})
it('sends a selected numeric phase without a string conversion in the API payload', async () => {
  render(<ActiveTransportation />)
  await waitFor(() =>
    expect(screen.getByTestId('selection').textContent).toContain('"id":5')
  )
  fireEvent.click(screen.getByRole('button', { name: 'Phase 2' }))
  fireEvent.click(screen.getByRole('button', { name: 'Generate Report' }))
  await waitFor(() =>
    expect(mockFetch).toHaveBeenCalledWith({
      data: expect.objectContaining({ phase: 2 }),
    })
  )
})
