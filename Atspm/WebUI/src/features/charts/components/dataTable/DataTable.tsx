import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import type { EChartsOption, SeriesOption } from 'echarts'
import React from 'react'

const DataTable = ({ option }: { option: EChartsOption }) => {
  const axis = Array.isArray(option.xAxis) ? option.xAxis[0] : option.xAxis
  const axisData =
    axis && 'data' in axis && Array.isArray(axis.data) ? axis.data : []
  const series = Array.isArray(option.series)
    ? option.series
    : option.series
      ? [option.series]
      : []
  const values = (s: SeriesOption): unknown[] =>
    'data' in s && Array.isArray(s.data) ? s.data : []
  const text = (value: unknown): string =>
    value && typeof value === 'object' && 'value' in value
      ? text(value.value)
      : String(value ?? '')

  return (
    <TableContainer component={Paper} style={{ maxWidth: '100%' }}>
      <Table aria-label="ECharts Data Table">
        <TableHead>
          <TableRow>
            {series.map((s, index) => (
              <TableCell key={index} colSpan={2} align="center">
                {String(s.name ?? '')}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            {series.map((_, index) => (
              <React.Fragment key={index}>
                <TableCell align="center">Timestamp</TableCell>
                <TableCell align="center">Value</TableCell>
              </React.Fragment>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {axisData.map((timestamp, rowIndex) => (
            <TableRow key={rowIndex}>
              {series.map((s, seriesIndex) => (
                <React.Fragment key={seriesIndex}>
                  <TableCell align="center">{text(timestamp)}</TableCell>
                  <TableCell align="center">
                    {text(values(s)[rowIndex])}
                  </TableCell>
                </React.Fragment>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default DataTable
