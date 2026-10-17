import { getLocationFromKey } from '@/api/config'
import { getLocationWithApproaches } from './MultipleLocationsSelect'
jest.mock('@/api/config', () => ({ getLocationFromKey: jest.fn() }))
jest.mock('@/features/locations/components/selectLocationMap', () => () => null)
it('preserves search filters and loads approach and pedestrian phase configuration', async () => {
  const selected = { id: 5, locationIdentifier: '001', areas: [7], charts: [4] }
  jest
    .mocked(getLocationFromKey)
    .mockResolvedValueOnce({
      value: [
        {
          id: 5,
          areas: [{ id: 7 }],
          pedsAre1to1: true,
          approaches: [{ id: 8, protectedPhaseNumber: 2 }],
        },
      ],
    })
  const result = await getLocationWithApproaches([selected, {}])
  expect(result).toEqual([
    {
      ...selected,
      pedsAre1to1: true,
      approaches: [{ id: 8, protectedPhaseNumber: 2 }],
    },
  ])
  expect(getLocationFromKey).toHaveBeenCalledTimes(1)
  expect(selected.areas).toEqual([7])
})
