import { useSegmentEditorStore } from './segmentEditorStore'
import {
  buildDirections,
  buildSegmentPayload,
  propertiesFromFeature,
  readSegment,
  readSegmentCollection,
  toMapSegment,
} from './segmentModel'
const properties = {
  Id: 'guid-1',
  Name: 'Main',
  UdotRouteNumber: '0015',
  FunctionalType: 'Highway',
  StartMilePoint: 0,
  EndMilePoint: 2,
  SpeedLimit: 65,
  Polarity: 'NM',
}
const feature = {
  id: 'guid-1',
  geometry: {
    type: 'LineString',
    coordinates: [
      [-111, 40],
      [-112, 41],
    ],
  },
  properties,
}
it('reads existing Pascal or camel property names and preserves string IDs and zero miles', () => {
  const first = readSegment({ features: [feature] })
  const camel = readSegment({
    features: [
      {
        ...feature,
        properties: {
          id: 'guid-1',
          name: 'Main',
          udotRouteNumber: '0015',
          functionalType: 'Highway',
          startMilePoint: 0,
          endMilePoint: 2,
          speedLimit: 65,
        },
      },
    ],
  })
  expect(first.properties.startMilePoint).toBe(0)
  expect(camel.properties.Id).toBe('guid-1')
  expect(propertiesFromFeature(first)).toMatchObject({
    id: 'guid-1',
    polarity: 'NM',
    entities: [],
  })
})
it('rejects malformed data and missing save responses, while ignoring non-line list features', () => {
  expect(() => readSegment(undefined)).toThrow()
  expect(() => readSegment({ features: [] })).toThrow('no segment')
  expect(
    readSegmentCollection({
      features: [{ geometry: { type: 'Point', coordinates: [0, 0] } }, feature],
    }).features
  ).toHaveLength(1)
  expect(() =>
    readSegment({
      features: [
        {
          ...feature,
          geometry: { type: 'LineString', coordinates: [[Infinity, 0]] },
        },
      ],
    })
  ).toThrow()
})
it('flips coordinates only for the list map, without mutating the API geometry', () => {
  const parsed = readSegment({ features: [feature] })
  expect(toMapSegment(parsed).geometry.coordinates).toEqual([
    [40, -111],
    [41, -112],
  ])
  expect(parsed.geometry.coordinates).toEqual([
    [-111, 40],
    [-112, 41],
  ])
})
it('validates required save fields without turning blank mile points into zero', () => {
  const draft = propertiesFromFeature(readSegment({ features: [feature] }))
  draft.shape = 'LINESTRING (-111 40, -112 41)'
  expect(buildSegmentPayload(draft)).toMatchObject({
    name: 'Main',
    startMilePoint: 0,
    shape: draft.shape,
  })
  expect(() => buildSegmentPayload({ ...draft, startMilePoint: null })).toThrow(
    'Start mile point'
  )
})
it('preserves direction variants and handles blank or unknown directions safely', () => {
  expect(buildDirections('NB', 'NM')).toEqual(['N', 'NB', 'NW', 'NE', 'NM'])
  expect(buildDirections(null, 'PM')).toEqual(['PM'])
  expect(buildDirections('unknown', null)).toEqual([])
})
it('keeps draft coordinates and WKT in longitude/latitude order and resets associations', () => {
  const store = useSegmentEditorStore.getState()
  store.reset()
  store.setPolylineCoordinates([
    [-111, 40],
    [-112, 41],
  ])
  store.addPolylineCoordinate([-113, 42])
  expect(useSegmentEditorStore.getState().segmentProperties.shape).toBe(
    'LINESTRING (-111 40, -112 41, -113 42)'
  )
  store.setAssociatedEntityIds(['one'])
  store.reset()
  expect(useSegmentEditorStore.getState().associatedEntityIds).toEqual([])
  expect(useSegmentEditorStore.getState().polylineCoordinates).toEqual([])
})
