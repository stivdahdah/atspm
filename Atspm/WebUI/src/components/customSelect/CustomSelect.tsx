import {
  Box,
  Checkbox,
  Chip,
  FormControl,
  FormHelperText,
  InputLabel,
  ListItemIcon,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  SelectProps,
} from '@mui/material'
import { ReactNode } from 'react'

export interface SingularListDataItems {
  id?: number | string
  icon?: ReactNode
  label?: ReactNode
}

export type PossibleValues = number | number[] | string | string[] | undefined

interface CustomSelectProps<T extends SingularListDataItems>
  extends Omit<SelectProps<unknown>, 'onChange' | 'value'> {
  label: string
  name: string
  value: PossibleValues
  data: T[] | undefined
  onChange: (event: SelectChangeEvent<unknown>) => void
  onDelete?: (id: number | string) => void
  displayProperty: keyof T
  multiple?: boolean
  helperText?: string
  error?: boolean
  fullWidth?: boolean
  hideLabel?: boolean
}

const CustomSelect = <T extends SingularListDataItems>({
  label,
  name,
  value,
  displayProperty,
  onChange,
  onDelete,
  data: inputData = [],
  multiple = false,
  fullWidth = false,
  helperText,
  error,
  hideLabel,
  ...rest
}: CustomSelectProps<T>) => {
  const data = inputData.filter(
    (item): item is T & { id: number | string } => item.id != null
  )
  const handleDelete = (id: number | string) => () => {
    if (onDelete) {
      onDelete(id)
    }
  }

  const validValue = (() => {
    if (multiple) {
      return Array.isArray(value)
        ? value.filter((v) => data.some((item) => item.id === v))
        : []
    } else {
      return data.some((item) => item.id === value) ? value : ''
    }
  })()

  const labelId = `${label.split(' ').join('').toLowerCase()}-select-label`
  const isItemSelected = (itemId: number | string) => {
    if (multiple && Array.isArray(value)) {
      return (value as Array<typeof itemId>).includes(itemId)
    }
    return value === itemId
  }

  const renderValue = (selected: unknown) => {
    if (multiple && Array.isArray(selected)) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.5,
          }}
        >
          {selected.map((val) => {
            const item = data.find((item) => item.id === val)
            return (
              <Chip
                key={String(val)}
                label={item ? String(item[displayProperty]) : String(val)}
                onDelete={handleDelete(val)}
                onMouseDown={(event) => {
                  event.stopPropagation()
                }}
              />
            )
          })}
        </Box>
      )
    }
    const selectedItem = data.find((item) => item.id === selected)
    return selectedItem ? String(selectedItem[displayProperty]) : ''
  }

  const renderOptions = () => {
    return data.flatMap((item) => {
      return (
        <MenuItem key={String(item.id)} value={item.id}>
          {item.icon ? <ListItemIcon>{item.icon}</ListItemIcon> : null}
          {multiple ? <Checkbox checked={isItemSelected(item.id)} /> : null}
          {String(item[displayProperty])}
        </MenuItem>
      )
    })
  }

  return (
    <FormControl
      fullWidth={fullWidth}
      error={error}
      margin="dense"
      sx={{
        '& .MuiInputBase-root': {
          minHeight: 56,
        },
      }}
    >
      {!hideLabel && <InputLabel htmlFor={labelId}>{label}</InputLabel>}
      <Select
        inputProps={{ id: labelId }}
        name={name}
        multiple={multiple}
        value={validValue}
        onChange={onChange}
        input={
          <OutlinedInput
            id={`select-${multiple ? 'multiple-chip' : 'single'}-${name}`}
            label={hideLabel ? undefined : label}
            inputProps={{ id: labelId }}
          />
        }
        renderValue={renderValue}
        {...rest}
      >
        {renderOptions()}
      </Select>
      {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
    </FormControl>
  )
}

export default CustomSelect
