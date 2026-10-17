/** @jest-environment node */
import * as echarts from 'echarts'
import transform from './speedCompliance.transformer'

it('renders numeric milepoint bands in the SVG renderer without invalid geometry', () => {
  const chart = echarts.init(null, undefined, {
    renderer: 'svg',
    ssr: true,
    width: 1000,
    height: 600,
  })
  try {
    chart.setOption(
      transform([
        {
          average: 0,
          avgVsBaseSpeed: 0,
          eightyFifth: 40,
          eightyFifthPercentileVsBaseSpeed: 0,
          startDate: '2026-01-01',
          endDate: '2026-02-01',
          startingMilePoint: 0,
          endingMilePoint: 1,
          segmentId: 'a',
          segmentName: 'Test Road',
          speedLimit: 40,
        },
      ])
    )
    const svg = chart.renderToSVGString()
    expect(svg).toContain('<svg')
    expect(svg).toContain('Test Road')
    expect(svg).not.toMatch(/NaN|Infinity/)
  } finally {
    chart.dispose()
  }
})
