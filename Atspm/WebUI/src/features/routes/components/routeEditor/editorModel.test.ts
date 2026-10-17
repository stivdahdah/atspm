import {
  createRouteLink,
  readEditableRoute,
  relinkRoute,
  routeToDto,
  type RouteEditorDistance,
} from './editorModel'

const directions = [
  { name: 'NA', value: 0 },
  { name: 'NB', value: 1 },
  { name: 'SB', value: 2 },
]
const link = (id: string, order: number) => ({
  ...createRouteLink(
    { id: Number(id), locationIdentifier: id, latitude: 40, longitude: -111 },
    7,
    order
  ),
  primaryDirectionId: 'NB',
  opposingDirectionId: 2,
  primaryPhase: 0,
  opposingPhase: 6,
})
const distance: RouteEditorDistance = {
  id: 5,
  distance: 0,
  locationIdentifierA: '1',
  locationIdentifierB: '2',
}

it('loads the backend route DTO, preserves audit fields and sorts a copy', () => {
  const dto = {
    id: 7,
    name: 'Main',
    createdBy: 'operator',
    routeLocations: [
      { locationIdentifier: '2', order: 2 },
      { locationIdentifier: '1', order: 1 },
    ],
  }
  const result = readEditableRoute(dto)
  expect(result.routeLocations.map((l) => l.locationIdentifier)).toEqual([
    '1',
    '2',
  ])
  expect(result.createdBy).toBe('operator')
  expect(dto.routeLocations[0].locationIdentifier).toBe('2')
})
it('rejects malformed route responses rather than inventing an ID', () => {
  expect(() => readEditableRoute({ name: 'Missing ID' })).toThrow('ID')
  expect(() => readEditableRoute({ id: 7, routeLocations: [{}] })).toThrow(
    'identifier'
  )
})
it('serializes dropdown names and existing numeric directions into the unchanged DTO', () => {
  const route = {
    id: 7,
    name: 'Main',
    routeLocations: relinkRoute([link('1', 0), link('2', 1)], [distance]),
  }
  const before = JSON.stringify(route)
  const dto = routeToDto(route, directions)
  expect(dto.routeLocations?.[0]).toMatchObject({
    primaryDirectionId: 1,
    opposingDirectionId: 2,
    primaryPhase: 0,
    opposingPhase: 6,
    nextLocationDistance: { distance: 0, id: 5 },
  })
  expect(JSON.stringify(route)).toBe(before)
})
it('rejects blank or unknown directions without a write', () => {
  expect(() =>
    routeToDto(
      {
        id: 7,
        name: 'Main',
        routeLocations: [{ ...link('1', 0), primaryDirectionId: 'unknown' }],
      },
      directions
    )
  ).toThrow('directions')
})
it('requires a phase and distances for nonterminal locations', () => {
  expect(() =>
    routeToDto(
      {
        id: 7,
        name: 'Main',
        routeLocations: [{ ...link('1', 0), primaryPhase: null }],
      },
      directions
    )
  ).toThrow('phases')
  expect(() =>
    routeToDto(
      { id: 7, name: 'Main', routeLocations: [link('1', 0), link('2', 1)] },
      directions
    )
  ).toThrow('distance')
})
it('reconnects both sides of an adjacency after reordering without stale distances', () => {
  const original = relinkRoute([link('1', 0), link('2', 1)], [distance])
  const reversed = relinkRoute([...original].reverse(), [distance])
  expect(
    reversed.map((l) => [
      l.order,
      l.previousLocationDistance,
      l.nextLocationDistance,
    ])
  ).toEqual([
    [0, null, null],
    [1, null, null],
  ])
  expect(original[0].nextLocationDistance).toBe(distance)
})
it('uses the bridge distance after removing a middle location and clears endpoints', () => {
  const bridge = { ...distance, locationIdentifierB: '3', distance: 200 }
  const result = relinkRoute([link('1', 0), link('3', 2)], [distance, bridge])
  expect(result[0].previousLocationDistanceId).toBeNull()
  expect(result[0].nextLocationDistance).toBe(bridge)
  expect(result[1].previousLocationDistance).toBe(bridge)
  expect(result[1].nextLocationDistanceId).toBeNull()
})
