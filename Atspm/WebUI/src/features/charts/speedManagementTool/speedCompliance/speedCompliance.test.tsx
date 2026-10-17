import { SpeedComplianceDto } from '@/api/speedManagement/aTSPMSpeedManagementApi.schemas'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import transform from './speedCompliance.transformer'
import SpeedComplianceChartsContainer from './SpeedComplianceChartsContainer'
jest.mock('@/features/charts/components/apacheEChart/ApacheEChart', () => ({
  __esModule: true,
  default: () => <div>Chart</div>,
}))
const segment = (
  patch: Partial<SpeedComplianceDto> = {}
): SpeedComplianceDto => ({
  average: 0,
  avgVsBaseSpeed: 0,
  eightyFifth: 40,
  eightyFifthPercentileVsBaseSpeed: 0,
  endDate: '2026-02-01',
  startDate: '2026-01-01',
  startingMilePoint: 0,
  endingMilePoint: 1,
  segmentId: 'one',
  segmentName: 'Test Road',
  speedLimit: 40,
  ...patch,
})
it('handles an empty compliance response without constructing invalid bounds', () => {
  const chart = transform([])
  expect(chart.tableData.milePoints).toEqual([])
  expect(chart.series).toEqual([])
})
it('keeps milepoint plan bands numeric and preserves zero speeds and custom limits', () => {
  const chart = transform([segment()], 0)
  const series = Array.isArray(chart.series) ? chart.series : []
  expect(series[3].data).toEqual([[0.5, 1, '{plan|Test Road}']])
  expect(chart.tableData.speedLimit).toEqual([0])
  expect(chart.tableData.avgSpeed).toEqual([0])
  render(<SpeedComplianceChartsContainer chartData={chart} />)
  expect(screen.queryByText('NaN')).not.toBeInTheDocument()
  expect(screen.getByText('MP 0.0 - 1.0')).toBeInTheDocument()
})
it('sorts reversed extents immutably and breaks lines across gaps', () => {
  const input = [
    segment({ startingMilePoint: 5, endingMilePoint: 3 }),
    segment(),
  ]
  const chart = transform(input)
  expect(chart.tableData.milePoints).toEqual([
    [0, 1],
    [3, 5],
  ])
  expect(input[0].startingMilePoint).toBe(5)
  const series = Array.isArray(chart.series) ? chart.series : []
  expect(series[0].data).toContainEqual([null, null])
})
