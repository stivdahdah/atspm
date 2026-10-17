import { isMapLocation } from './mapLocation'
it('allows zero coordinates and rejects missing, non-finite and out-of-range coordinates', () => {
  expect(isMapLocation({ id: 0, latitude: 0, longitude: 0 })).toBe(true)
  for (const location of [
    { id: 1, latitude: undefined, longitude: 0 },
    { id: 1, latitude: 0, longitude: Infinity },
    { id: 1, latitude: 91, longitude: 0 },
    { latitude: 1, longitude: 1 },
  ])
    expect(isMapLocation(location)).toBe(false)
})
