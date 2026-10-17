import { speedRequest } from '@/lib/axios'
import { getTimeChart, getVariabilityChart } from './speedChartContracts'
jest.mock('@/lib/axios', () => ({
  speedRequest: jest.fn().mockResolvedValue({}),
}))
it('preserves numeric time aggregation modes and source arrays on the existing endpoint', async () => {
  const data: Parameters<typeof getTimeChart>[0] = {
    startDate: '2026-01-01',
    endDate: '2026-02-01',
    segmentId: 'a',
    sourceId: [1],
    timeOptions: 0,
  }
  await getTimeChart(data)
  expect(speedRequest).toHaveBeenLastCalledWith(
    expect.objectContaining({
      url: '/api/v1/SpeedOverTime/getReportData',
      method: 'POST',
      data,
    })
  )
})
it('preserves numeric weekdays on the variability endpoint', async () => {
  const data: Parameters<typeof getVariabilityChart>[0] = {
    startDate: '2026-01-01',
    endDate: '2026-02-01',
    segmentId: 'a',
    sourceId: [1],
    daysOfWeek: [0, 6],
  }
  await getVariabilityChart(data)
  expect(speedRequest).toHaveBeenLastCalledWith(
    expect.objectContaining({
      url: '/api/v1/SpeedVariability/getReportData',
      method: 'POST',
      data,
    })
  )
})
