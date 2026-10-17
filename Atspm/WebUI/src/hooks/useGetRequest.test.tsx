import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ConfigEnum, useConfigEnums } from './useConfigEnums'
import { useGetRequest } from './useGetRequest'
import { configAxios } from '@/lib/axios'

jest.mock('@/lib/axios', () => ({ configAxios: { get: jest.fn() } }))

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

beforeEach(() => jest.clearAllMocks())

it('selects a different result type without changing the fetched response', async () => {
  jest.mocked(configAxios.get).mockResolvedValue('raw metadata')
  const select = jest.fn((raw: string) => ({ label: raw.toUpperCase() }))
  const { result } = renderHook(() => useGetRequest<string, { label: string }>({
    route: '/metadata', config: { select },
  }), { wrapper: createWrapper() })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(result.current.data).toEqual({ label: 'RAW METADATA' })
  expect(select).toHaveBeenCalledWith('raw metadata')
})

it('loads named numeric enum members from configuration XML', async () => {
  jest.mocked(configAxios.get).mockResolvedValue(`
    <Schema><EnumType Name="DirectionTypes">
      <Member Name="NA" Value="0"/><Member Name="NB" Value="1"/>
    </EnumType></Schema>`)
  const { result } = renderHook(() => useConfigEnums(ConfigEnum.DirectionTypes), {
    wrapper: createWrapper(),
  })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(result.current.data).toEqual([{ name: 'NA', value: 0 }, { name: 'NB', value: 1 }])
  expect(result.current.findEnumByNameOrAbbreviation('NB')).toEqual({ name: 'NB', value: 1 })
  expect(result.current.findEnumByNameOrAbbreviation(0)).toEqual({ name: 'NA', value: 0 })
  expect(result.current.findEnumByNameOrAbbreviation('missing')).toBeUndefined()
  expect(configAxios.get).toHaveBeenCalledWith('/$metadata', { headers: undefined })
})

it('returns no enum members when metadata does not contain the requested enum', async () => {
  jest.mocked(configAxios.get).mockResolvedValue('<Schema/>')
  const { result } = renderHook(() => useConfigEnums(ConfigEnum.DirectionTypes), {
    wrapper: createWrapper(),
  })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(result.current.data).toBeUndefined()
  expect(result.current.findEnumByNameOrAbbreviation('NA')).toBeUndefined()
})
