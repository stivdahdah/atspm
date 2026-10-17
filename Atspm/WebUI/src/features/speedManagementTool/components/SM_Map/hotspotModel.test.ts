import {
  getHotspotCoordinates,
  getHotspotRouteId,
  readHotspotCategories,
  readHotspots,
} from './hotspotModel'

it('reads feature arrays and collections without mutating coordinates or zero metrics', () => {
  const row = {
    properties: { route_id: 'segment-1', averageSpeed: 0, speedLimit: 55 },
    geometry: {
      type: 'LineString',
      coordinates: [
        [-111, 40],
        [-112, 41],
      ],
    },
  }
  const [hotspot] = readHotspots({ features: [row] }, 'monthly')
  expect(hotspot.properties.averageSpeed).toBe(0)
  expect(hotspot.hotspotSource).toBe('monthly')
  expect(getHotspotCoordinates(hotspot)).toEqual([
    [40, -111],
    [41, -112],
  ])
  expect(row.geometry.coordinates).toEqual([
    [-111, 40],
    [-112, 41],
  ])
  expect(readHotspots([row], 'monthly')).toEqual([hotspot])
})

it('flips impact geometry collections and resolves the middle segment independently of impact ID', () => {
  const [hotspot] = readHotspots(
    [
      {
        id: 'impact-id',
        segmentIds: ['first', 'middle', 'last'],
        properties: {
          description: 'Traffic calming',
          changeInAverageSpeed: -3,
        },
        geometry: {
          type: 'GeometryCollection',
          geometries: [
            {
              type: 'LineString',
              coordinates: [
                [-111, 0],
                [-112, 1],
              ],
            },
            {
              type: 'LineString',
              coordinates: [
                [-113, 2],
                [-114, 3],
              ],
            },
          ],
        },
      },
    ],
    'impact'
  )
  expect(getHotspotRouteId(hotspot)).toBe('middle')
  expect(getHotspotCoordinates(hotspot)).toEqual([
    [0, -111],
    [1, -112],
    [2, -113],
    [3, -114],
  ])
  expect(hotspot.geometry?.geometries?.[1].coordinates).toEqual([
    [2, -113],
    [3, -114],
  ])
})

it('handles missing optional geometry and identifiers without guessing a selectable segment', () => {
  const [hotspot] = readHotspots(
    [{ properties: {}, geometry: null, id: null }],
    'impact'
  )
  expect(getHotspotRouteId(hotspot)).toBeNull()
  expect(getHotspotCoordinates(hotspot)).toEqual([])
  expect(readHotspots(null, 'monthly')).toEqual([])
  expect(readHotspots({ features: [] }, 'monthly')).toEqual([])
})

it('rejects malformed feature shapes and non-finite or incorrectly nested coordinates', () => {
  expect(() => readHotspots([{ segmentId: 'bare-dto' }], 'monthly')).toThrow()
  expect(() => readHotspots({}, 'impact')).toThrow()
  for (const coordinates of [[[NaN, 40]], [['bad', 40]], [[[-111, 40]]]]) {
    expect(() =>
      readHotspots([{ properties: {}, geometry: { coordinates } }], 'monthly')
    ).toThrow()
  }
})

it('validates numeric category identifiers without confusing the impact sentinel with a monthly category', () => {
  expect(
    readHotspotCategories([{ number: 0, displayName: 'Average Speed' }])
  ).toEqual([{ number: 0, displayName: 'Average Speed' }])
  expect(() => readHotspotCategories(undefined)).toThrow()
  expect(() =>
    readHotspotCategories([{ number: '0', displayName: 'Average Speed' }])
  ).toThrow()
  expect(() =>
    readHotspotCategories([
      { number: 100, displayName: 'Invalid monthly category' },
    ])
  ).toThrow()
})
