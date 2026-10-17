import type { PriorityDetailsResult } from '@/api/reports'
import { init } from 'echarts'
import { cartesianBounds, categoryBandSize } from './priorityDetails.rendering'
import transform from './priorityDetails.transformer'

const start = '2026-04-07T08:00:00Z'
const end = '2026-04-07T08:01:00Z'
const row: PriorityDetailsResult = {
  start,
  end,
  phaseNumber: 2,
  transitSignalPriorityNumber: 1,
  locationIdentifier: '001',
  cycleEvents: [
    { start, value: 1 },
    { start: '2026-04-07T08:00:10Z', value: 8 },
  ],
  priorityAndPreemptionEvents: [
    { name: 'Detector 1', events: [{ detectorOn: start, detectorOff: end }] },
  ],
}
function getChart(rows: PriorityDetailsResult[]) {
  const result = transform(rows)
  const chart = result.data.charts[0]?.chart
  if (!chart || !Array.isArray(chart.series))
    throw new Error('Expected chart and series')
  return { chart, series: chart.series }
}
it('accepts the API array and the existing data wrapper and preserves phase indication durations', () => {
  const { series } = getChart([row])
  const wrapped = transform({ data: [row] }).data.charts[0]?.chart
  expect(wrapped?.xAxis).toEqual(getChart([row]).chart.xAxis)
  expect(series.find((s) => s.name === 'Phase Min Green')?.data).toEqual([
    expect.objectContaining({
      value: [0, Date.parse(start), Date.parse(start) + 10000, 10000],
    }),
  ])
})
it('returns an empty result for empty or incomplete rows and ignores invalid ranges before valid rows', () => {
  expect(transform([]).data.charts).toEqual([])
  expect(transform([{}]).data.charts).toEqual([])
  const { chart } = getChart([{ start: 'invalid', end, phaseNumber: 1 }, row])
  expect(Array.isArray(chart.xAxis) && chart.xAxis[0].min).toBe(
    new Date(start).toISOString()
  )
})
it('builds native ECharts line coordinates and preserves an on marker when off is absent or invalid', () => {
  const { series } = getChart([
    {
      ...row,
      priorityAndPreemptionEvents: [
        {
          name: 'A',
          events: [
            { detectorOn: start, detectorOff: end },
            { detectorOn: start, detectorOff: 'invalid' },
            { detectorOn: start },
          ],
        },
      ],
    },
  ])
  const lines = series.find((s) => s.type === 'lines')
  expect(lines?.data).toEqual([
    expect.objectContaining({
      coords: [
        [Date.parse(start), 0],
        [Date.parse(end), 0],
      ],
    }),
  ])
  const on = series.find(
    (s) =>
      s.type === 'scatter' &&
      s.name === 'Detection Event' &&
      s.symbol === 'circle'
  )
  expect(on?.data).toHaveLength(3)
})
it('deduplicates in-range event markers and excludes invalid and out-of-range timestamps', () => {
  const event = { timestamp: start, eventCode: 113, eventParam: 1 }
  const { series } = getChart([
    {
      ...row,
      tspEvents: [
        event,
        event,
        { ...event, timestamp: 'invalid' },
        { ...event, timestamp: '2025-01-01' },
      ],
    },
  ])
  expect(
    series.find(
      (s) =>
        s.type === 'scatter' &&
        s.name === 'Early Green (113)' &&
        s.xAxisIndex === 1
    )?.data
  ).toEqual([[start, 0]])
})
it('checks renderer bounds and handles missing or scalar ECharts band sizing', () => {
  expect(cartesianBounds({ type: 'polar' })).toBeUndefined()
  expect(categoryBandSize({})).toBeUndefined()
  expect(categoryBandSize({ size: () => 20 })).toBeUndefined()
  expect(categoryBandSize({ size: () => [10, 20] })).toBe(20)
})
it('renders the detail chart with the installed ECharts SVG renderer', () => {
  const canvas = jest
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockImplementation(() => null)
  const chart = init(null, undefined, {
    renderer: 'svg',
    ssr: true,
    width: 1000,
    height: 800,
  })
  try {
    chart.setOption(getChart([row]).chart)
    expect(chart.renderToSVGString()).toContain('<svg')
    expect(chart.renderToSVGString()).toContain('Phase Number')
  } finally {
    chart.dispose()
    canvas.mockRestore()
  }
})
