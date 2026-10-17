import { generateDetectorSeriesData } from './timingAndActuation.transformer'
it('connects valid stop-bar events using time and category coordinates', () => {
  const start = '2026-01-01T00:00:00',
    end = '2026-01-01T00:00:01'
  const series = generateDetectorSeriesData(
    [{ name: 'Stop Bar 1', events: [{ detectorOn: start, detectorOff: end }] }],
    ['Other', 'Stop Bar 1']
  )
  expect(series[2].data).toEqual([
    {
      coords: [
        [Date.parse(start), 1],
        [Date.parse(end), 1],
      ],
    },
  ])
})
it('keeps valid on markers but skips malformed or reversed connector intervals', () => {
  const series = generateDetectorSeriesData(
    [
      {
        name: 'Stop Bar 1',
        events: [
          { detectorOn: 'invalid', detectorOff: 'invalid' },
          { detectorOn: '2026-01-02', detectorOff: '2026-01-01' },
        ],
      },
    ],
    ['Stop Bar 1']
  )
  expect(series[0].data).toEqual([['2026-01-02', 'Stop Bar 1']])
  expect(series[2].data).toEqual([])
})
