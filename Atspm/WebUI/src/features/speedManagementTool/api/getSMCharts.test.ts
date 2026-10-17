import { speedRequest } from '@/lib/axios'
import { useQuery } from 'react-query'
import { SM_ChartType, useSMCharts } from './getSMCharts'
jest.mock('react-query', () => ({
  ...jest.requireActual('react-query'),
  useQuery: jest.fn(),
}))
jest.mock('@/lib/axios', () => ({ speedRequest: jest.fn() }))
it.each([
  null,
  { startDate: 'invalid', endDate: '2026-01-02' },
  { startDate: '2026-02-01', endDate: '2026-01-01' },
])(
  'rejects incomplete or invalid dates before sending a request: %s',
  async (options) => {
    useSMCharts(SM_ChartType.SPEED_COMPLIANCE, options)
    const queryFn: unknown = jest.mocked(useQuery).mock.calls.at(-1)?.[0]
    if (
      !queryFn ||
      typeof queryFn !== 'object' ||
      !('queryFn' in queryFn) ||
      typeof queryFn.queryFn !== 'function'
    )
      throw new Error('Missing query function')
    await expect(queryFn.queryFn()).rejects.toThrow(/Choose/)
    expect(speedRequest).not.toHaveBeenCalled()
  }
)
