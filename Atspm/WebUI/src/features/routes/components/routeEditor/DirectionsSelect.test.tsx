import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import DirectionSelect from './DirectionsSelect'
import { createRouteLink } from './editorModel'

const approaches = Object.freeze([
  {
    directionTypeId: 'SB',
    protectedPhaseNumber: 6,
    isProtectedPhaseOverlap: true,
  },
  {
    directionTypeId: 'NB',
    protectedPhaseNumber: 2,
    isProtectedPhaseOverlap: false,
  },
])
jest.mock('@/features/locations/api', () => ({
  useLocationApproaches: () => ({ data: { value: approaches } }),
}))
jest.mock('@/hooks/useConfigEnums', () => ({
  ConfigEnum: { DirectionTypes: 'DirectionTypes' },
  useConfigEnums: () => ({
    data: [
      { name: 'NB', value: 1 },
      { name: 'SB', value: 2 },
    ],
  }),
}))

it('shows a persisted numeric direction without mutating the route or query cache', () => {
  const link = Object.freeze({
    ...createRouteLink({ id: 1, locationIdentifier: '1' }, 7, 0),
    primaryDirectionId: 1,
    primaryPhase: 2,
    isPrimaryOverlap: false,
  })
  render(
    <DirectionSelect
      link={link}
      updateType="primary"
      hasErrors={false}
      onUpdate={jest.fn()}
    />
  )
  expect(screen.getByRole('combobox')).toHaveTextContent('NB')
  expect(screen.getByRole('combobox')).toHaveTextContent('2')
  expect(link.primaryDirectionId).toBe(1)
  expect(approaches[0].protectedPhaseNumber).toBe(6)
})
it('updates the phase as a number and preserves the selected overlap', () => {
  const onUpdate = jest.fn()
  const link = {
    ...createRouteLink({ id: 1, locationIdentifier: '1' }, 7, 0),
    primaryDirectionId: 1,
    primaryPhase: 2,
    isPrimaryOverlap: false,
  }
  render(
    <DirectionSelect
      link={link}
      updateType="primary"
      hasErrors={false}
      onUpdate={onUpdate}
    />
  )
  fireEvent.mouseDown(screen.getByRole('combobox'))
  fireEvent.click(screen.getByRole('option', { name: /SB.*6/ }))
  expect(onUpdate).toHaveBeenCalledWith(
    expect.objectContaining({
      primaryDirectionId: 'SB',
      primaryPhase: 6,
      isPrimaryOverlap: true,
    })
  )
  expect(link.primaryDirectionId).toBe(1)
})
