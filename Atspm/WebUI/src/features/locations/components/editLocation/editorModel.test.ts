import {
  approachToDto,
  formNumber,
  locationGeneralToDto,
  readConfigApproach,
  readConfigLocation,
  type ApproachEnumLookups,
} from './editorModel'

const members = [
  { name: 'NA', value: 0 },
  { name: 'NB', value: 1 },
  { name: 'AC', value: 1 },
]
const find = (value: string | number) =>
  members.find((m) => m.name === value || m.value === value)
const enums: ApproachEnumLookups = {
  direction: find,
  detection: find,
  hardware: find,
  movement: find,
  lane: find,
}
const form = () =>
  readConfigApproach({
    id: 12,
    locationId: 1,
    protectedPhaseNumber: 2,
    directionTypeId: 1,
    detectors: [
      {
        id: 24,
        detectorChannel: 7,
        dateAdded: '2026-01-01T12:00:00',
        detectionHardware: 0,
        movementType: 0,
        laneType: 0,
        detectionTypes: [{ id: 1, abbreviation: 'AC' }],
      },
    ],
  })

it('models a loaded location with stable IDs and initialized child collections', () => {
  const dto = { id: 1, start: '2026-01-01T00:00:00', latitude: 0, longitude: 0 }
  expect(readConfigLocation(dto)).toMatchObject({
    id: 1,
    latitude: 0,
    longitude: 0,
    approaches: [],
    areas: [],
  })
  expect(() => readConfigLocation({})).toThrow('ID')
})
it('keeps blank form values distinct from numeric zero', () => {
  expect(formNumber('')).toBeNull()
  expect(formNumber('0')).toBe(0)
  expect(() => formNumber('not a number')).toThrow('valid number')
})
it('converts form strings and enum labels to wire values without mutating the draft', () => {
  const draft = form()
  draft.directionTypeId = 'NB'
  draft.protectedPhaseNumber = '0'
  draft.detectors[0].detectorChannel = '7'
  draft.detectors[0].latencyCorrection = ''
  draft.detectors[0].detectionHardware = 'NA'
  const before = JSON.stringify(draft)
  const dto = approachToDto(draft, '100', enums)
  expect(dto).toMatchObject({
    id: 12,
    directionTypeId: 1,
    protectedPhaseNumber: 0,
    detectors: [
      {
        id: 24,
        detectorChannel: 7,
        latencyCorrection: 0,
        dectectorIdentifier: '1007',
        detectionHardware: 0,
        detectionTypes: [{ id: 1 }],
      },
    ],
  })
  expect(JSON.stringify(draft)).toBe(before)
})
it('omits temporary IDs and editor-only fields from a new approach payload', () => {
  const draft = form()
  Object.assign(draft, { isNew: true, open: true, index: 3 })
  draft.detectors[0].isNew = true
  const dto = approachToDto(draft, '100', enums)
  expect(dto.id).toBeUndefined()
  expect(dto.detectors?.[0].id).toBeUndefined()
  expect(dto.detectors?.[0].approachId).toBeUndefined()
  expect(dto).not.toHaveProperty('open')
  expect(dto).not.toHaveProperty('index')
  expect(dto).not.toHaveProperty('isNew')
})
it('blocks incomplete required values instead of serializing blank phases as zero', () => {
  const draft = form()
  draft.protectedPhaseNumber = ''
  expect(() => approachToDto(draft, '100', enums)).toThrow('Phase Number')
  draft.protectedPhaseNumber = 0
  draft.detectors[0].detectorChannel = null
  expect(() => approachToDto(draft, '100', enums)).toThrow('Detector Channel')
})
it('does not silently replace unknown enums with NA', () => {
  const draft = form()
  draft.directionTypeId = 'unknown'
  expect(() => approachToDto(draft, '100', enums)).toThrow(
    'Unknown configuration enum'
  )
})
it('serializes general location settings without overwriting child navigation data', () => {
  const draft = readConfigLocation({
    id: 1,
    start: '2026-01-01T00:00:00',
    latitude: 0,
    longitude: 0,
    createdBy: 'operator',
  })
  draft.latitude = '40.123'
  draft.longitude = '-111.456'
  const dto = locationGeneralToDto(draft)
  expect(dto).toMatchObject({
    id: 1,
    latitude: 40.123,
    longitude: -111.456,
    start: '2026-01-01',
  })
  expect(dto).not.toHaveProperty('approaches')
  expect(dto).not.toHaveProperty('devices')
  expect(dto).not.toHaveProperty('createdBy')
  draft.latitude = ''
  expect(() => locationGeneralToDto(draft)).toThrow('Latitude')
})
