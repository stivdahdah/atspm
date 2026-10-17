import { getPolylineCoordinates } from './geometry'
it('accepts the existing route geometry without a type field and retains zero coordinates', () => {
  expect(
    getPolylineCoordinates({
      coordinates: [
        [0, 0],
        [-111, 40],
      ],
    })
  ).toEqual([
    [0, 0],
    [-111, 40],
  ])
})
it('flattens multiline routes and rejects incomplete coordinates before snapping', () => {
  expect(
    getPolylineCoordinates({
      type: 'MultiLineString',
      coordinates: [
        [
          [0, 0],
          [1, 2],
        ],
      ],
    })
  ).toEqual([
    [0, 0],
    [1, 2],
  ])
  expect(() => getPolylineCoordinates({ coordinates: [[1]] })).toThrow(
    'Invalid route coordinate'
  )
})
