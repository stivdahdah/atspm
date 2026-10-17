import { render, screen } from '@testing-library/react'
import { readNearbyEntities, readSegment } from '../../segmentModel'
import HoveredEntity from './HoveredEntity'
it('shows an entity as an entity even when the service includes extra geometry metadata', () => {
  const entity = readNearbyEntities([
    {
      id: 'one',
      entityId: 'entity-one',
      sourceId: 1,
      entityType: 'Signal',
      version: '1',
      direction: 'NB',
      startDate: '2026-01-01',
      coordinates: [[-111, 40]],
      geometry: {
        type: 'LineString',
        coordinates: [
          [-111, 40],
          [-112, 41],
        ],
      },
    },
  ])[0]
  render(<HoveredEntity hoveredEntity={entity} />)
  expect(screen.getByText('entity-one')).toBeTruthy()
})
it('shows parsed segment names and speed limits in the segment hover panel', () => {
  const segment = readSegment({
    features: [
      {
        id: 'segment-one',
        geometry: {
          type: 'LineString',
          coordinates: [
            [-111, 40],
            [-112, 41],
          ],
        },
        properties: {
          Id: 'segment-one',
          Name: 'Main street',
          UdotRouteNumber: '0015',
          FunctionalType: 'Highway',
          StartMilePoint: 0,
          EndMilePoint: 1,
          SpeedLimit: 65,
        },
      },
    ],
  })
  render(<HoveredEntity hoveredEntity={segment} />)
  expect(screen.getByText('Main street')).toBeTruthy()
})
