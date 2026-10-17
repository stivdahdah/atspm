import type { SpeedComplianceDto } from '@/api/speedManagement/aTSPMSpeedManagementApi.schemas'
import {
  createDataZoom,
  createGrid,
  createLegend,
  createTooltip,
  createYAxis,
} from '@/features/charts/common/transformers'
import { ExtendedEChartsOption } from '@/features/charts/types'
import {
  Color,
  DashedLineSeriesSymbol,
  SolidLineSeriesSymbol,
  formatChartDateTimeRange,
} from '@/features/charts/utils'
import type {
  LineSeriesOption,
  ScatterSeriesOption,
  XAXisComponentOption,
} from 'echarts'
import { createSpeedManagementTitle } from './createSpeedManagementTitle'

type Segment = Pick<
  SpeedComplianceDto,
  | 'average'
  | 'eightyFifth'
  | 'speedLimit'
  | 'startDate'
  | 'endDate'
  | 'startingMilePoint'
  | 'endingMilePoint'
  | 'segmentName'
>
export type SpeedProfileChart = ExtendedEChartsOption & {
  tableData: {
    milePoints: Array<[number, number] | null>
    speedLimit: Array<number | null>
    avgSpeed: Array<number | null>
    eightyFifth: Array<number | null>
  }
}
const finite = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null

export function createSpeedProfile(
  response: Segment[],
  name: string,
  customSpeedLimit?: number | null,
  addDataZoom = true
): SpeedProfileChart {
  const rows = response
    .filter(
      (row) =>
        Number.isFinite(row.startingMilePoint) &&
        Number.isFinite(row.endingMilePoint)
    )
    .map((row) => ({
      ...row,
      startingMilePoint: Math.min(row.startingMilePoint, row.endingMilePoint),
      endingMilePoint: Math.max(row.startingMilePoint, row.endingMilePoint),
    }))
    .sort((a, b) => a.startingMilePoint - b.startingMilePoint)
  const tableData: SpeedProfileChart['tableData'] = {
    milePoints: [],
    speedLimit: [],
    avgSpeed: [],
    eightyFifth: [],
  }
  const average: Array<[number | null, number | null]> = []
  const eightyFifth: typeof average = []
  const limit: typeof average = []
  rows.forEach((row, index) => {
    const values = [
      finite(row.average),
      finite(row.eightyFifth),
      finite(customSpeedLimit ?? row.speedLimit),
    ]
    tableData.milePoints.push([row.startingMilePoint, row.endingMilePoint])
    tableData.avgSpeed.push(values[0])
    tableData.eightyFifth.push(values[1])
    tableData.speedLimit.push(values[2])
    ;[average, eightyFifth, limit].forEach((points, metric) => {
      if (
        index > 0 &&
        rows[index - 1].endingMilePoint !== row.startingMilePoint
      )
        points.push([null, null])
      points.push(
        [row.startingMilePoint, values[metric]],
        [row.endingMilePoint, values[metric]]
      )
    })
  })
  const first = rows[0]
  const dateRange =
    first &&
    Number.isFinite(Date.parse(first.startDate)) &&
    Number.isFinite(Date.parse(first.endDate))
      ? formatChartDateTimeRange(first.startDate, first.endDate)
      : ''
  const title = createSpeedManagementTitle({ title: name, dateRange })
  const xAxis: XAXisComponentOption = {
    type: 'value',
    name: 'Mile Points',
    ...(rows.length
      ? {
          min: Math.min(...rows.map((row) => row.startingMilePoint)),
          max: Math.max(...rows.map((row) => row.endingMilePoint)),
        }
      : {}),
  }
  const yAxis = createYAxis(true, { name: 'Speed (mph)' })
  const grid = createGrid({ top: 100, left: 60, right: 210 })
  const series: LineSeriesOption[] = [
    {
      name: 'Average Speed',
      data: average,
      type: 'line',
      step: 'start',
      showSymbol: false,
      color: Color.Blue,
    },
    {
      name: '85th Percentile Speed',
      data: eightyFifth,
      type: 'line',
      step: 'start',
      showSymbol: false,
      color: Color.Red,
    },
    {
      name: 'Speed Limit',
      data: limit,
      type: 'line',
      step: 'start',
      showSymbol: false,
      color: Color.Black,
      lineStyle: { type: 'dashed' },
    },
  ]
  const plans: ScatterSeriesOption = {
    name: 'Plans',
    type: 'scatter',
    symbol: 'roundRect',
    symbolSize: 3,
    yAxisIndex: yAxis.length - 1,
    silent: true,
    color: Color.Grey,
    tooltip: { show: false },
    data: rows.map((row) => [
      (row.startingMilePoint + row.endingMilePoint) / 2,
      1,
      `{plan|${row.segmentName}}`,
    ]),
    labelLayout: {
      y: 65,
      moveOverlap: 'shiftX',
      hideOverlap: rows.length > 10,
      draggable: true,
    },
    labelLine: { show: true, lineStyle: { color: '#bbb' } },
    label: {
      show: true,
      color: '#000',
      fontSize: 9,
      padding: 8,
      borderRadius: 5,
      align: 'right',
      backgroundColor: '#f0f0f0',
      rich: { plan: { fontSize: 9, fontWeight: 'bold', align: 'left' } },
      formatter: (params) =>
        Array.isArray(params.data) ? String(params.data[2] ?? '') : '',
    },
    markArea: {
      data: rows.map((row, index) => [
        {
          xAxis: row.startingMilePoint,
          itemStyle: { color: index % 2 === 0 ? Color.PlanA : Color.PlanB },
        },
        { xAxis: row.endingMilePoint },
      ]),
    },
  }
  return {
    title,
    xAxis,
    yAxis,
    grid,
    tooltip: createTooltip(),
    legend: createLegend({
      top: grid.top,
      data: [
        { name: 'Average Speed', icon: SolidLineSeriesSymbol },
        { name: '85th Percentile Speed', icon: SolidLineSeriesSymbol },
        { name: 'Speed Limit', icon: DashedLineSeriesSymbol },
      ],
    }),
    series: rows.length ? [...series, plans] : [],
    dataZoom: addDataZoom ? createDataZoom() : undefined,
    displayProps: { useNumberForZoom: true },
    tableData,
  }
}
