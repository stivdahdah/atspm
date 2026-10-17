import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { EChartsOption } from 'echarts'
import PrioritySummaryDetailsChart from './PrioritySummaryChart'

const mockFetch = jest.fn()
const mockTransform = jest.fn()
function mockMakeChart() {
  let disposed = false
  return {
    setOption: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    resize: jest.fn(),
    showLoading: jest.fn(),
    hideLoading: jest.fn(),
    isDisposed: () => disposed,
    dispose: jest.fn(() => {
      disposed = true
    }),
  }
}
const mockCharts: ReturnType<typeof mockMakeChart>[] = []
jest.mock('echarts', () => ({
  init: () => {
    const chart = mockMakeChart()
    mockCharts.push(chart)
    return chart
  },
}))
jest.mock('@/api/reports/priority-details/priority-details', () => ({
  getPriorityDetailsReportData: (...args: unknown[]) => mockFetch(...args),
}))
jest.mock('../priorityDetails.transformer', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockTransform(...args),
}))
const start = '2026-04-07T08:00:00Z'
const end = '2026-04-07T08:01:00Z'
const summary: EChartsOption = { title: { text: 'Summary' } }
const detail: EChartsOption = { title: { text: 'Detail' } }
const event = {
  seriesType: 'bar',
  seriesName: 'TSP Request (112→115)',
  data: [start, 60, 1, end, '001', start, end],
}
function clickEvent(data = event) {
  const listener = mockCharts[0].on.mock.calls[0][1]
  return listener(data)
}
beforeEach(() => {
  jest.clearAllMocks()
  mockCharts.length = 0
  mockFetch.mockResolvedValue([])
  mockTransform.mockReturnValue({ data: { charts: [{ chart: detail }] } })
})
it('uses a synchronous click listener, loads the existing API, and supports returning to the summary', async () => {
  render(<PrioritySummaryDetailsChart id="chart" option={summary} />)
  act(() => {
    expect(clickEvent()).toBeUndefined()
  })
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument()
  )
  expect(mockFetch).toHaveBeenCalledWith(
    expect.objectContaining({ locationIdentifier: '001' })
  )
  expect(mockTransform).toHaveBeenCalledWith([])
  fireEvent.click(screen.getByRole('button', { name: 'Back' }))
  expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
})
it('ignores invalid drilldown payloads and unrelated chart series', () => {
  render(<PrioritySummaryDetailsChart id="chart" option={summary} />)
  act(() => {
    clickEvent({ ...event, data: [start, 60, 1, end, '001', 'invalid', end] })
    clickEvent({ ...event, seriesType: 'scatter' })
  })
  expect(mockFetch).not.toHaveBeenCalled()
})
it('discards responses after the source chart has been replaced', async () => {
  let resolve: (value: unknown[]) => void = () => undefined
  mockFetch.mockImplementationOnce(
    () =>
      new Promise((complete) => {
        resolve = complete
      })
  )
  const { rerender } = render(
    <PrioritySummaryDetailsChart id="chart" option={summary} />
  )
  act(() => {
    clickEvent()
  })
  rerender(
    <PrioritySummaryDetailsChart
      id="chart"
      option={{ title: { text: 'New summary' } }}
    />
  )
  await act(async () => {
    resolve([])
  })
  expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
  expect(mockCharts[1].setOption).not.toHaveBeenCalledWith(
    detail,
    expect.anything()
  )
})
