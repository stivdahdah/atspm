import CongestionChart from '@/features/charts/speedManagementTool/congestionTracker/components/CongestionTrackerChart'
import { Box } from '@mui/material'
import { transformCongestionTrackerData as transformChart } from '../../congestionTracker.transformer'

const CongestionTrackingChartsContainer = ({
  chartData,
}: {
  chartData: ReturnType<typeof transformChart>
}) => {
  const chartOptions = chartData.charts[0]
  if (!chartOptions) return null

  const baseHeight = 150
  const rowHeight = 100
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
      <CongestionChart
        id="congestion-chart"
        option={chartOptions}
        style={{
          width: '1100px',
          height: `${rowHeight * chartOptions.numOfRows + baseHeight}px`,
        }}
        hideInteractionMessage
      />
    </Box>
  )
}

export default CongestionTrackingChartsContainer
