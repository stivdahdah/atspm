import {
  readPedestrianLocation,
  readPedestrianTimeUnit,
  roundPedestrianData,
} from './reportModel'

it('requires stable numeric IDs and identifiers and initializes approaches', () => {
  expect(
    readPedestrianLocation({ id: 1, locationIdentifier: '001' })
  ).toMatchObject({ id: 1, locationIdentifier: '001', approaches: [] })
  expect(() => readPedestrianLocation({ id: 1 })).toThrow('identifier')
})
it('restricts URL time units to backend enum values and falls back to Hour', () => {
  expect(readPedestrianTimeUnit(4)).toBe(4)
  expect(readPedestrianTimeUnit(999)).toBe(0)
  expect(readPedestrianTimeUnit(NaN)).toBe(0)
})
it('handles absent optional statistics and volume collections without inventing zeroes', () => {
  const result = roundPedestrianData({
    averageVolumeByHourOfDay: null,
    averageDailyVolume: 0,
  })
  expect(result.statisticData).toBeUndefined()
  expect(result.averageVolumeByHourOfDay).toBeNull()
  expect(result.averageDailyVolume).toBe(0)
  expect(result.totalVolume).toBeUndefined()
})
it('rounds actual backend volume and statistic fields without mutating cached responses', () => {
  const original = Object.freeze({
    totalVolume: 12.6,
    averageDailyVolume: 1.8,
    averageVolumeByHourOfDay: [Object.freeze({ index: 1, volume: 2.7 })],
    rawData: [Object.freeze({ pedestrianCount: null })],
    statisticData: Object.freeze({ count: 12.6, mean: 1.8, min: null, max: 0 }),
  })
  const result = roundPedestrianData(original)
  expect(result).toMatchObject({
    totalVolume: 13,
    averageDailyVolume: 2,
    averageVolumeByHourOfDay: [{ volume: 3 }],
    rawData: [{ pedestrianCount: null }],
    statisticData: { count: 13, mean: 2, min: null, max: 0 },
  })
  expect(result.statisticData).not.toHaveProperty('totalVolume')
  expect(original.totalVolume).toBe(12.6)
  expect(original.averageVolumeByHourOfDay[0].volume).toBe(2.7)
})

it('preserves explicit null statistics from the backend without dereferencing them', () => {
  const payload = JSON.parse(
    '{"statisticData":null,"averageVolumeByDayOfWeek":null}'
  )
  expect(roundPedestrianData(payload).statisticData).toBeNull()
})
