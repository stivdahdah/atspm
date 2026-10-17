import type {
  SpeedComplianceOptions,
  SpeedOverTimeDto,
  SpeedOverTimeOptions,
  SpeedVariabilityDto,
  SpeedVariabilityOptions,
} from '@/api/speedManagement/aTSPMSpeedManagementApi.schemas'
import { speedRequest } from '@/lib/axios'
import type { TimeOptions } from '../enums'

export type ComplianceOptions = SpeedComplianceOptions & {
  customSpeedLimit?: number | null
}
// These existing controls send numeric bins/weekdays. Keep that legacy wire
// representation until the separate service's differing enum schema is verified.
export type TimeChartOptions = Omit<
  SpeedOverTimeOptions,
  'timeOptions' | 'monthAggClassification' | 'timePeriod'
> &
  Partial<
    Pick<SpeedOverTimeOptions, 'monthAggClassification' | 'timePeriod'>
  > & { timeOptions?: TimeOptions }
export type VariabilityOptions = Omit<SpeedVariabilityOptions, 'daysOfWeek'> & {
  daysOfWeek: number[]
}
export const getTimeChart = (data: TimeChartOptions) =>
  speedRequest<SpeedOverTimeDto>({
    url: '/api/v1/SpeedOverTime/getReportData',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  })
export const getVariabilityChart = (data: VariabilityOptions) =>
  speedRequest<SpeedVariabilityDto>({
    url: '/api/v1/SpeedVariability/getReportData',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  })
