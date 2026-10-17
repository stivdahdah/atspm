import { transformChartData } from '../api/transformData'
import { ChartType, type RawChartResponse } from '../common/types'
it('dispatches the existing priority-summary API wrapper without losing its report payload', () => {
  const response: RawChartResponse = {
    type: ChartType.PrioritySummary,
    data: {
      start: '2026-04-07T08:00:00Z',
      end: '2026-04-07T08:01:00Z',
      locationIdentifier: '001',
      cycles: [],
    },
  }
  const result = transformChartData(response)
  expect(result.type).toBe(ChartType.PrioritySummary)
  expect(result.data.charts).toHaveLength(1)
})
