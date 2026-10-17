import { getPhases, readSavedTspOptions, readTspLocation } from './reportModel'

it('derives distinct sorted phases and skips missing phase values', () => {
  expect(
    getPhases({
      approaches: [
        {},
        { protectedPhaseNumber: 6 },
        { protectedPhaseNumber: 2 },
        { protectedPhaseNumber: 2 },
      ],
    })
  ).toEqual([2, 6])
})
it('defaults new selections to 2 and 6 only when both phases exist', () => {
  expect(
    readTspLocation({
      approaches: [{ protectedPhaseNumber: 2 }, { protectedPhaseNumber: 6 }],
    }).designatedPhases
  ).toEqual([2, 6])
  expect(readTspLocation({}).designatedPhases).toEqual([])
})
it('preserves explicit user phases, including an intentionally empty selection, without mutation', () => {
  const input = {
    approaches: [{ protectedPhaseNumber: 2 }, { protectedPhaseNumber: 6 }],
    designatedPhases: [4],
  }
  expect(readTspLocation(input).designatedPhases).toEqual([4])
  expect(
    readTspLocation({ ...input, designatedPhases: [] }).designatedPhases
  ).toEqual([])
  const result = readTspLocation(input)
  result.designatedPhases.push(8)
  expect(input.designatedPhases).toEqual([4])
})
it('reads the existing saved preset shape and rejects malformed or invalid dates', () => {
  const preset = {
    '@odata.type': '#AtspmOptionsBase.TransitSignalPriorityOptions',
    locationsAndPhases: [
      { locationIdentifier: '001', designatedPhases: [2, 6] },
    ],
    dates: ['2026-01-01T00:00:00.000Z'],
  }
  expect(
    readSavedTspOptions(preset).locationsAndPhases[0].designatedPhases
  ).toEqual([2, 6])
  expect(() => readSavedTspOptions({})).toThrow()
  expect(() => readSavedTspOptions({ ...preset, dates: ['invalid'] })).toThrow(
    'Invalid saved report date'
  )
})
