import {
  getTimeChart,
  getVariabilityChart,
  type ComplianceOptions,
  type TimeChartOptions,
  type VariabilityOptions,
} from './speedChartContracts'
// #region license
// Copyright 2026 Utah Departement of Transportation
// for WebUI - getSMCharts.ts
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//http://www.apache.org/licenses/LICENSE-2.
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// #endregion
import { useQuery, UseQueryOptions, UseQueryResult } from 'react-query'

import { transformCongestionTrackerData } from '@/features/charts/speedManagementTool/congestionTracker/congestionTracker.transformer'
import transformSpeedOverDistanceData from '@/features/charts/speedManagementTool/speedOverDistance/components/speedOverDistance.transformer'
import { default as transformSpeedOverTimeData } from '@/features/charts/speedManagementTool/speedOverTime/speedOverTime.transformer'

import {
  postApiV1CongestionTrackingGetReportData,
  postApiV1DataQualityGetReportData,
  postApiV1EffectivenessOfStrategiesGetReportData,
  postApiV1SpeedComplianceGetReportData,
  postApiV1SpeedFromImpactSegmentSegmentId,
  postApiV1SpeedOverDistanceGetReportData,
  postApiV1SpeedViolationsGetReportData,
} from '@/api/speedManagement/aTSPMSpeedManagementApi'

import {
  CongestionTrackingOptions,
  DataQualityOptions,
  EffectivenessOfStrategiesOptions,
  SpeedComplianceOptions,
  SpeedFromImpactOptions,
  SpeedOverDistanceOptions,
  SpeedViolationsOptions,
} from '@/api/speedManagement/aTSPMSpeedManagementApi.schemas'
import transformDataQualityData from '@/features/charts/speedManagementTool/dataQuality/dataQuality.transformer'
import transformEffectivenessOfStrategiesData from '@/features/charts/speedManagementTool/effectivenessOfStrategies/effectivenessOfStrategies.transformer'
import transformSpeedComplianceData from '@/features/charts/speedManagementTool/speedCompliance/speedCompliance.transformer'
import transformSpeedVariabilityData from '@/features/charts/speedManagementTool/speedVariability/speedVariability.transformer'
import transformSpeedViolationsData from '@/features/charts/speedManagementTool/speedViolations/speedViolations.transformer'

export enum SM_ChartType {
  CONGESTION_TRACKING = 'Congestion Tracking',
  SPEED_OVER_TIME = 'Speed over Time',
  SPEED_OVER_DISTANCE = 'Speed over Distance',
  SPEED_COMPLIANCE = 'Speed Compliance',
  DATA_QUALITY = 'Data Quality',
  SPEED_VIOLATIONS = 'Speed Violations',
  SPEED_VARIABILITY = 'Speed Variability',
  EFFECTIVENESS_OF_STRATEGIES = 'Effectiveness of Strategies',
}

type TransformedCongestionTrackerData = ReturnType<
  typeof transformCongestionTrackerData
>
type TransformedSpeedOverTimeData = ReturnType<
  typeof transformSpeedOverTimeData
>
type TransformedSpeedOverDistanceData = ReturnType<
  typeof transformSpeedOverDistanceData
>
type TransformedSpeedComplianceData = ReturnType<
  typeof transformSpeedComplianceData
>
type TransformedSpeedVariabilityData = ReturnType<
  typeof transformSpeedVariabilityData
>
type TransformedEffectivenessOfStrategiesData = ReturnType<
  typeof transformEffectivenessOfStrategiesData
>

type TransformedSpeedViolationsData = ReturnType<
  typeof transformSpeedViolationsData
>

type TransformedDataQualityData = ReturnType<typeof transformDataQualityData>

// Map chart types to options and data types
export type ChartOptionsMapping = {
  [SM_ChartType.CONGESTION_TRACKING]: CongestionTrackingOptions
  [SM_ChartType.SPEED_OVER_TIME]: TimeChartOptions
  [SM_ChartType.SPEED_OVER_DISTANCE]: SpeedOverDistanceOptions
  [SM_ChartType.SPEED_COMPLIANCE]: ComplianceOptions
  [SM_ChartType.DATA_QUALITY]: DataQualityOptions
  [SM_ChartType.SPEED_VARIABILITY]: VariabilityOptions
  [SM_ChartType.SPEED_VIOLATIONS]: SpeedViolationsOptions
  [SM_ChartType.EFFECTIVENESS_OF_STRATEGIES]: EffectivenessOfStrategiesOptions
}

export type SMChartsDataMapping = {
  [SM_ChartType.CONGESTION_TRACKING]: TransformedCongestionTrackerData
  [SM_ChartType.SPEED_OVER_TIME]: TransformedSpeedOverTimeData
  [SM_ChartType.SPEED_OVER_DISTANCE]: TransformedSpeedOverDistanceData
  [SM_ChartType.SPEED_COMPLIANCE]: TransformedSpeedComplianceData
  [SM_ChartType.DATA_QUALITY]: TransformedDataQualityData
  [SM_ChartType.SPEED_VARIABILITY]: TransformedSpeedVariabilityData
  [SM_ChartType.SPEED_VIOLATIONS]: TransformedSpeedViolationsData
  [SM_ChartType.EFFECTIVENESS_OF_STRATEGIES]: TransformedEffectivenessOfStrategiesData
}

export type SMChartsResult = {
  [K in SM_ChartType]: { type: K; data: SMChartsDataMapping[K] }
}[SM_ChartType]
type UseSMChartsOptions<TChartType extends SM_ChartType> = Omit<
  UseQueryOptions<SMChartsResult, Error>,
  'queryKey' | 'queryFn'
> & { enabled?: boolean }

// Implementation of useSMCharts
export function useSMCharts<TChartType extends SM_ChartType>(
  chartType: TChartType | null,
  chartOptions: Partial<ChartOptionsMapping[SM_ChartType]> | null,
  config?: UseSMChartsOptions<TChartType>
): UseQueryResult<SMChartsResult, Error> {
  const queryFn = async (): Promise<SMChartsDataMapping[TChartType]> => {
    if (!chartOptions)
      throw new Error('Choose chart options before running a chart.')
    const dates = chartOptions as Partial<SpeedComplianceOptions>
    if (
      chartType !== SM_ChartType.EFFECTIVENESS_OF_STRATEGIES &&
      (!dates.startDate ||
        !dates.endDate ||
        !Number.isFinite(Date.parse(dates.startDate)) ||
        !Number.isFinite(Date.parse(dates.endDate)) ||
        Date.parse(dates.startDate) > Date.parse(dates.endDate))
    ) {
      throw new Error(
        'Choose a valid start and end date before running a chart.'
      )
    }
    switch (chartType) {
      case SM_ChartType.SPEED_VARIABILITY: {
        const response = await getVariabilityChart(
          chartOptions as VariabilityOptions
        )
        return transformSpeedVariabilityData(
          response
        ) as SMChartsDataMapping[TChartType]
      }

      case SM_ChartType.CONGESTION_TRACKING: {
        const response = await postApiV1CongestionTrackingGetReportData(
          chartOptions as CongestionTrackingOptions
        )

        return transformCongestionTrackerData(
          response
        ) as SMChartsDataMapping[TChartType]
      }

      case SM_ChartType.SPEED_OVER_TIME: {
        const response = await getTimeChart(chartOptions as TimeChartOptions)
        const impactChartOptions = {
          ...chartOptions,
          sourceId: (chartOptions as TimeChartOptions).sourceId?.[0],
        }
        const impactResponse = await postApiV1SpeedFromImpactSegmentSegmentId(
          (chartOptions as TimeChartOptions).segmentId,
          impactChartOptions as SpeedFromImpactOptions
        )
        return transformSpeedOverTimeData(
          response,
          impactResponse
        ) as SMChartsDataMapping[TChartType]
      }

      case SM_ChartType.SPEED_OVER_DISTANCE: {
        const response = await postApiV1SpeedOverDistanceGetReportData(
          chartOptions as SpeedOverDistanceOptions
        )
        return transformSpeedOverDistanceData(
          response
        ) as SMChartsDataMapping[TChartType]
      }

      case SM_ChartType.SPEED_COMPLIANCE: {
        const response = await postApiV1SpeedComplianceGetReportData(
          chartOptions as SpeedComplianceOptions
        )
        return transformSpeedComplianceData(
          response,
          (chartOptions as ComplianceOptions).customSpeedLimit
        ) as SMChartsDataMapping[TChartType]
      }

      case SM_ChartType.DATA_QUALITY: {
        const response = await postApiV1DataQualityGetReportData(
          chartOptions as DataQualityOptions
        )
        return transformDataQualityData(
          response
        ) as SMChartsDataMapping[TChartType]
      }

      case SM_ChartType.SPEED_VIOLATIONS:
        const speedViolationsOptions = chartOptions as SpeedViolationsOptions
        const response = await postApiV1SpeedViolationsGetReportData(
          speedViolationsOptions as SpeedViolationsOptions
        )
        return transformSpeedViolationsData(
          response
        ) as SMChartsDataMapping[TChartType]

      case SM_ChartType.EFFECTIVENESS_OF_STRATEGIES: {
        const response = await postApiV1EffectivenessOfStrategiesGetReportData(
          chartOptions as EffectivenessOfStrategiesOptions
        )

        return transformEffectivenessOfStrategiesData(
          response
        ) as SMChartsDataMapping[TChartType]
      }

      default:
        throw new Error(`Unsupported chart type: ${chartType}`)
    }
  }

  return useQuery<SMChartsResult, Error>({
    queryKey: ['sm_charts', chartType, chartOptions],
    queryFn: async () => {
      const data = await queryFn()
      // The switch above selects the transformer matching this chart type.
      return { type: chartType, data } as SMChartsResult
    },
    enabled: false,
    ...config,
  })
}
