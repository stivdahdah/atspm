// /features/activeTransportation/transformers/dailyPedVolByMonth.ts
import {
  createDataZoom,
  createGrid,
  createLegend,
  createToolbox,
  createTooltip,
} from '@/features/charts/common/transformers'
import { EChartsOption } from 'echarts'

export interface MonthlyPedestrianVolume {
  month: string
  averageVolume: number
}

export default function transformDailyPedVolByMonthTransformer(
  data: MonthlyPedestrianVolume[]
): EChartsOption {
  const title = {
    text: 'Average Daily Pedestrian Volume, by Month of Year',
    left: 'center',
  }

  const xAxis = {
    type: 'category' as const,
    name: 'Month',
    data: data.map((d) => d.month),
  }

  const yAxis = {
    type: 'value' as const,
    name: 'Volume',
  }

  const grid = createGrid({ top: 80, left: 60, right: 190, bottom: 80 })

  const legend = createLegend({
    data: ['Average Hourly Volume'],
  })

  const dataZoom = createDataZoom()

  const toolbox = createToolbox(
    { title: 'Monthly Pedestrian Volume', dateRange: '' },
    '',
    'basic'
  )

  const tooltip = createTooltip()

  const series = [
    {
      type: 'bar' as const,
      name: 'Average Hourly Volume',
      data: data.map((d) => d.averageVolume),
    },
  ]

  const chartOptions: EChartsOption = {
    title,
    xAxis,
    yAxis,
    grid,
    legend,
    dataZoom,
    toolbox,
    tooltip,
    series,
  }

  return chartOptions
}
