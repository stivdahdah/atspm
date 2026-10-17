import { SearchLocation as Location } from '@/api/config'
import type { PedestrianTimeUnit } from '@/api/reports'
import MultipleLocationsSelect from '@/components/MultipleLocationsSelect/MultipleLocationsSelect'
import SelectDateTime from '@/components/selectTimeSpan'
import { StyledPaper } from '@/components/StyledPaper'
import LocationsDisplay from '@/features/activeTransportation/components/LocationsDisplay'
import { ATErrorState } from '@/pages/reports/pedestrian-activity'
import { DropResult } from '@hello-pangea/dnd'
import {
  Box,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
} from '@mui/material'
import type { PedestrianLocation, PedestrianPhase } from '../reportModel'
import { readPedestrianTimeUnit } from '../reportModel'

interface ActiveTransportationOptionsProps {
  errorState: ATErrorState
  locations: PedestrianLocation[]
  timeUnit: PedestrianTimeUnit
  startDate: Date
  endDate: Date
  phase: PedestrianPhase
  setLocations: (locations: Location[]) => void
  setTimeUnit: (unit: PedestrianTimeUnit) => void
  setStartDate: (date: Date) => void
  setEndDate: (date: Date) => void
  setPhase: (phase: PedestrianPhase) => void
  onLocationDelete: (location: PedestrianLocation) => void
  onReorderLocations: (dropResult: DropResult) => void
  onUpdateLocation: (updatedLocation: PedestrianLocation) => void
}

export const ActiveTransportationOptions = ({
  locations,
  errorState,
  timeUnit,
  startDate,
  endDate,
  phase,
  setLocations,
  setTimeUnit,
  setStartDate,
  setEndDate,
  setPhase,
  onLocationDelete,
  onUpdateLocation,
}: ActiveTransportationOptionsProps) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'row' }}>
          <Box sx={{ width: '400px' }}>
            <MultipleLocationsSelect
              selectedLocations={locations}
              setLocations={setLocations}
              removeRouteSelect
            />
          </Box>
          <Divider orientation="vertical" sx={{ mx: 2 }} />
          <Box>
            <LocationsDisplay
              locations={locations}
              onLocationDelete={onLocationDelete}
              onDeleteAllLocations={() => setLocations([])}
              onUpdateLocation={onUpdateLocation}
              errorState={errorState}
              phase={phase}
              setPhase={setPhase}
            />
          </Box>
        </Paper>

        <StyledPaper sx={{ padding: 3, maxWidth: '350px', minWidth: '250px' }}>
          <SelectDateTime
            dateFormat={'MMM dd, yyyy'}
            startDateTime={startDate}
            endDateTime={endDate}
            views={['year', 'month', 'day']}
            changeStartDate={setStartDate}
            changeEndDate={setEndDate}
            noCalendar
          />

          <FormControl fullWidth>
            <InputLabel htmlFor="time-unit-input">Time Unit</InputLabel>
            <Select
              value={timeUnit}
              label="Time Unit"
              onChange={(e) =>
                setTimeUnit(readPedestrianTimeUnit(Number(e.target.value)))
              }
              inputProps={{ id: 'time-unit-input' }}
            >
              <MenuItem value={0}>Hour</MenuItem>
              <MenuItem value={1}>Day</MenuItem>
              <MenuItem value={2}>Week</MenuItem>
              <MenuItem value={3}>Month</MenuItem>
              <MenuItem value={4}>Year</MenuItem>
            </Select>
          </FormControl>
        </StyledPaper>
      </Box>
    </Box>
  )
}
