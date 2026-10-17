import { ChartType } from '../common/types'
import transform from './preemptionDetails.transformer'
import type { Cycle, RawPreemptionDetailsResponse } from './types'
const start = '2026-04-07T08:00:00Z',
  end = '2026-04-07T08:01:00Z'
const cycle: Cycle = {
  inputOn: start,
  inputOff: end,
  gateDown: null,
  callMaxOut: null,
  delay: 0,
  timeToService: null,
  dwellTime: null,
  trackClear: null,
}
it('omits missing measurements while preserving zero durations and timestamp offsets', () => {
  const payload: RawPreemptionDetailsResponse = {
    type: ChartType.PreemptionDetails,
    data: {
      summary: {
        start,
        end,
        locationIdentifer: '001',
        locationDescription: 'Main',
        requestAndServices: [
          { preemptionNumber: 1, requests: [start], services: [end] },
        ],
      },
      details: [
        {
          start,
          end,
          locationIdentifer: '001',
          locationDescription: 'Main',
          preemptionNumber: 1,
          cycles: [cycle, { ...cycle, inputOn: 'invalid' }],
        },
      ],
    },
  }
  const charts = transform(payload).data.charts
  const summary = charts[0].chart.series,
    details = charts[1].chart.series
  if (!Array.isArray(summary) || !Array.isArray(details))
    throw new Error('Expected series array')
  expect(summary.find((s) => s.name === 'Requests')?.data).toEqual([
    [start, '1'],
  ])
  expect(details.find((s) => s.name === 'Delay')?.data).toEqual([[start, 0]])
  expect(details.find((s) => s.name === 'Input Off')?.data).toEqual([
    [start, 60],
  ])
  expect(details.find((s) => s.name === 'Gate Down')?.data).toEqual([])
})
