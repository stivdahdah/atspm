import useSpeedManagementStore from '@/features/speedManagementTool/speedManagementStore'
import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import HotspotTable from './HotspotTable'
import ImpactHotspotTable from './ImpactHotspotsTable'
import { readHotspots } from './hotspotModel'

it('renders zero and missing comparison metrics distinctly and navigates using segment identity', () => {
  const onSelect = jest.fn()
  const onHover = jest.fn()
  const zoom = jest.fn()
  const originalZoom = useSpeedManagementStore.getState().zoomToHotspot
  useSpeedManagementStore.setState({ zoomToHotspot: zoom })
  try {
    render(
      <HotspotTable
        hotspots={readHotspots(
          [
            {
              properties: {
                name: 'Test Road',
                segmentId: 'segment',
                averageSpeed: 0,
                speedLimit: null,
                avgSpeedVsSpeedLimit: 3,
              },
              geometry: {
                coordinates: [
                  [-111, 40],
                  [-112, 41],
                ],
              },
            },
          ],
          'monthly'
        )}
        handleRouteDoubleClick={onSelect}
        setHoveredHotspot={onHover}
        compareDates
        selectedHotspotType="Average Speed"
        isLoading={false}
      />
    )
    const row = screen.getByRole('row', { name: /Test Road/ })
    const cells = within(row).getAllByRole('cell')
    expect(cells[2]).toHaveTextContent(/^0$/)
    expect(cells[3]).toHaveTextContent(/^N\/A$/)
    expect(cells[4]).toHaveTextContent(/^\+3$/)
    fireEvent.click(row)
    expect(zoom).toHaveBeenCalledWith(
      [
        [40, -111],
        [41, -112],
      ],
      undefined
    )
    fireEvent.doubleClick(row)
    expect(onSelect).toHaveBeenCalledWith('segment')
    fireEvent.mouseEnter(row)
    expect(onHover).toHaveBeenCalledWith('segment')
  } finally {
    act(() => useSpeedManagementStore.setState({ zoomToHotspot: originalZoom }))
  }
})

it('renders incomplete monthly hotspots without invalid selection or geometry access', () => {
  const onSelect = jest.fn()
  render(
    <HotspotTable
      hotspots={readHotspots(
        [{ properties: { name: 'Incomplete', binStartTime: 'invalid' } }],
        'monthly'
      )}
      handleRouteDoubleClick={onSelect}
      setHoveredHotspot={jest.fn()}
      compareDates={false}
      selectedHotspotType="Unknown category"
      isLoading={false}
    />
  )
  const row = screen.getByRole('row', { name: /Incomplete/ })
  fireEvent.click(row)
  fireEvent.doubleClick(row)
  expect(onSelect).not.toHaveBeenCalled()
  expect(within(row).getByText('N/A')).toBeInTheDocument()
})

it('uses a constituent segment for impact selection and preserves zero before/after metrics', () => {
  const onSelect = jest.fn()
  const onHover = jest.fn()
  render(
    <ImpactHotspotTable
      hotspots={readHotspots(
        [
          {
            id: 'impact-id',
            segmentIds: ['first', 'middle', 'last'],
            properties: {
              description: 'Safety change',
              beforeAverageSpeed: 0,
              afterAverageSpeed: 0,
              changeInAverageSpeed: 0,
            },
          },
        ],
        'impact'
      )}
      handleRouteSelection={onSelect}
      setHoveredHotspot={onHover}
      showBeforeAfter
      isLoading={false}
    />
  )
  const row = screen.getByRole('row', { name: /Safety change/ })
  expect(within(row).getAllByText('0')).toHaveLength(3)
  fireEvent.doubleClick(row)
  expect(onSelect).toHaveBeenCalledWith('middle')
  fireEvent.mouseEnter(row)
  expect(onHover).toHaveBeenCalledWith('middle')
})
