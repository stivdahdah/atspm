import type { TransitSignalPriorityResult } from '@/api/reports'
import { render, screen } from '@testing-library/react'
import * as XLSX from 'xlsx'
import { exportToExcel, default as TspReport } from './TspReport'

jest.mock('@/stores/notifications', () => ({
  useNotificationStore: () => ({ addNotification: jest.fn() }),
}))
jest.mock('@/api/config', () => ({
  useGetMeasureType: () => ({}),
  postMeasureOptionPreset: jest.fn(),
}))
jest.mock('xlsx', () => ({
  utils: {
    book_new: jest.fn(() => ({})),
    aoa_to_sheet: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
  },
  write: jest.fn(() => new ArrayBuffer(0)),
}))
jest.mock('@mui/x-data-grid', () => ({
  DataGrid: (props: { rows: unknown[] }) => (
    <div data-testid="rows">{JSON.stringify(props.rows)}</div>
  ),
}))
const report: TransitSignalPriorityResult[] = [
  {
    locationPhases: { locationIdentifier: '001' },
    transitSignalPlans: [
      { planNumber: 99, phases: null },
      { planNumber: 1, phases: [{ phaseNumber: 2, programmedSplit: 20 }] },
    ],
  },
]
it('renders plans with absent phases without producing undefined grid rows', () => {
  render(
    <TspReport
      report={report}
      reportOptions={{ selectedDays: [], locations: [] }}
    />
  )
  expect(screen.getByTestId('rows').textContent).toContain('"phaseNumber":2')
  expect(screen.getByTestId('rows').textContent).not.toContain('null,')
})
it('exports only actual phase rows when a plan has no phase data', () => {
  window.URL.createObjectURL = jest.fn(() => 'blob:test')
  const click = jest
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(() => undefined)
  exportToExcel(report, [{ locationIdentifier: '001' }])
  expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith(
    expect.arrayContaining([expect.arrayContaining([1, 2, 20])])
  )
  const calls = jest.mocked(XLSX.utils.aoa_to_sheet).mock.calls
  expect(calls[calls.length - 1][0]).toHaveLength(2)
  expect(calls[calls.length - 1][0][1][8]).toBe('')
  click.mockRestore()
})
