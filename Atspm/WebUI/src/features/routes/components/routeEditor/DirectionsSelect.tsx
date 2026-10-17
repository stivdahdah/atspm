import { useLocationApproaches } from '@/features/locations/api'
import { ConfigEnum, useConfigEnums } from '@/hooks/useConfigEnums'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import {
  Box,
  FormControl,
  FormHelperText,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
  useTheme,
} from '@mui/material'
import type { RouteEditorLink as RouteLocation } from './editorModel'

interface DirectionSelectProps {
  hasErrors: boolean
  link: RouteLocation
  onUpdate: (updatedLink: RouteLocation) => void
  updateType: 'primary' | 'opposing'
}

const DirectionSelect = ({
  hasErrors,
  link,
  onUpdate,
  updateType,
}: DirectionSelectProps) => {
  const theme = useTheme()
  const { data: approachesData } = useLocationApproaches({
    locationId: link.locationId ?? undefined,
  })

  const { data: directionTypes } = useConfigEnums(ConfigEnum.DirectionTypes)

  if (!directionTypes) return null

  const rawDirection =
    updateType === 'primary'
      ? link.primaryDirectionId
      : link.opposingDirectionId
  const directionTypeId =
    directionTypes.find(
      (d) => d.value === rawDirection || d.name === rawDirection
    )?.name ?? ''
  const phaseNumber =
    updateType === 'primary' ? link.primaryPhase : link.opposingPhase
  const isOverlap =
    updateType === 'primary' ? link.isPrimaryOverlap : link.isOpposingOverlap

  const formattedValue = `${directionTypeId}-${phaseNumber}-${
    isOverlap ? 'true' : 'false'
  }`

  const approaches = approachesData?.value
    ?.slice()
    .sort((a, b) => a.protectedPhaseNumber - b.protectedPhaseNumber)

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const [directionTypeId, protectedPhaseNumber, isOverlapStr] =
      event.target.value.split('-')
    const selectedApproach = approaches?.find(
      (approach) =>
        approach.directionTypeId === directionTypeId &&
        approach.protectedPhaseNumber.toString() === protectedPhaseNumber
    )

    if (selectedApproach) {
      const updatedLink = { ...link }

      if (updateType === 'primary') {
        updatedLink.primaryDirectionId = directionTypeId
        updatedLink.primaryPhase = Number(protectedPhaseNumber)
        updatedLink.isPrimaryOverlap = isOverlapStr === 'true'
      } else {
        updatedLink.opposingDirectionId = directionTypeId
        updatedLink.opposingPhase = Number(protectedPhaseNumber)
        updatedLink.isOpposingOverlap = isOverlapStr === 'true'
      }

      onUpdate(updatedLink)
    }
  }

  return (
    <FormControl fullWidth>
      <Select
        error={hasErrors && !directionTypeId}
        value={
          approaches?.some(
            (a) =>
              `${a.directionTypeId}-${a.protectedPhaseNumber}-${a.isProtectedPhaseOverlap}` ===
              formattedValue
          )
            ? formattedValue
            : ''
        }
        onChange={handleSelectChange}
        displayEmpty
        renderValue={() => (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              alignItems: 'center',
            }}
          >
            <Typography>{directionTypeId}</Typography>
            <Typography>{phaseNumber}</Typography>
            {isOverlap ? (
              <CheckBoxIcon color="success" fontSize="small" />
            ) : (
              <CheckBoxOutlineBlankIcon
                sx={{ color: theme.palette.grey[400] }}
                fontSize="small"
              />
            )}
          </Box>
        )}
        size="small"
      >
        {approaches?.map((approach, index) => (
          <MenuItem
            key={`${index}`}
            value={`${approach.directionTypeId}-${approach.protectedPhaseNumber}-${approach.isProtectedPhaseOverlap}`}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                alignItems: 'center',
              }}
            >
              <Typography>{approach.directionTypeId}</Typography>
              <Typography>{approach.protectedPhaseNumber}</Typography>
              {approach.isProtectedPhaseOverlap ? (
                <CheckBoxIcon color="success" fontSize="small" />
              ) : (
                <CheckBoxOutlineBlankIcon
                  sx={{ color: theme.palette.grey[400] }}
                  fontSize="small"
                />
              )}
            </Box>
          </MenuItem>
        ))}
      </Select>
      <FormHelperText error={hasErrors && !directionTypeId}>
        {hasErrors && !directionTypeId ? 'Direction is required' : ''}
      </FormHelperText>
    </FormControl>
  )
}

export default DirectionSelect
