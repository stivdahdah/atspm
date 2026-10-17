import { speedRequest } from '@/lib/axios'
import { getSegmentNearbyEntities } from './segmentEditorApi'
jest.mock('@/lib/axios', () => ({ speedRequest: jest.fn() }))
it('preserves the existing endpoint and direction request payload and validates the response', async () => {
  const data = {
    coordinates: [
      [-111, 40],
      [-112, 41],
    ] as [number, number][],
    directions: ['N', 'NB', 'PM'],
  }
  jest
    .mocked(speedRequest)
    .mockResolvedValueOnce([
      {
        id: 'one',
        entityId: 'source-one',
        sourceId: 1,
        entityType: 'Signal',
        version: '1',
        direction: 'NB',
        startDate: '2026-01-01',
        coordinates: [[-111, 40]],
      },
    ])
  await expect(getSegmentNearbyEntities({ data })).resolves.toEqual([
    expect.objectContaining({ id: 'one', coordinates: [[-111, 40]] }),
  ])
  expect(speedRequest).toHaveBeenCalledWith(
    expect.objectContaining({
      url: '/api/v1/Entity/GetEntitiesWithinRange',
      method: 'POST',
      data,
    })
  )
})
it('rejects unexpected responses instead of treating them as empty entity collections', async () => {
  jest.mocked(speedRequest).mockResolvedValueOnce(undefined)
  await expect(
    getSegmentNearbyEntities({ data: { coordinates: [], directions: [] } })
  ).rejects.toThrow()
})
