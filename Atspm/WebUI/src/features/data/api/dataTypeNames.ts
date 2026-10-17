import {
  getAggregationDataFromLocationIdentifierAndDataType,
  getEventLogDataFromLocationIdentifierAndDataType,
} from '@/api/data'

type RawType = Parameters<
  typeof getEventLogDataFromLocationIdentifierAndDataType
>[1]
type AggregationType = Parameters<
  typeof getAggregationDataFromLocationIdentifierAndDataType
>[1]
const rawTypes: readonly RawType[] = [
  'IndianaEvent',
  'PedestrianCounter',
  'SpeedEvent',
]
const aggregationTypes: readonly AggregationType[] = [
  'AggregationApproachBase',
  'ApproachPcdAggregation',
  'ApproachSpeedAggregation',
  'ApproachSplitFailAggregation',
  'ApproachYellowRedActivationAggregation',
  'DetectorEventCountAggregation',
  'PhaseCycleAggregation',
  'PhaseLeftTurnGapAggregation',
  'PhasePedAggregation',
  'PhaseSplitMonitorAggregation',
  'PhaseTerminationAggregation',
  'PreemptionAggregation',
  'PriorityAggregation',
  'SignalEventCountAggregation',
  'SignalPlanAggregation',
]
export const isRawDataType = (name: string): name is RawType =>
  rawTypes.some((type) => type === name)
export const isAggregationDataType = (name: string): name is AggregationType =>
  aggregationTypes.some((type) => type === name)
