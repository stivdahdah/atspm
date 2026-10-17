import { SearchLocation } from '@/api/config'
import { Autocomplete, Box, TextField } from '@mui/material'
import match from 'autosuggest-highlight/match'
import parse from 'autosuggest-highlight/parse'
import React from 'react'

type LocationOption = Omit<
  Pick<
    SearchLocation,
    'id' | 'locationIdentifier' | 'primaryName' | 'secondaryName'
  >,
  'id'
> & { id?: number | string }

interface SelectLocationNoMapProps<T extends LocationOption> {
  location: T | null
  setLocation: (location: T | null) => void
  locations: T[]
}

export default function SelectLocationNoMap<T extends LocationOption>({
  location,
  setLocation,
  locations,
}: SelectLocationNoMapProps<T>) {
  const handleChange = (event: React.SyntheticEvent, value: T | null) => {
    setLocation(value)
  }

  return (
    <Box>
      <Autocomplete
        value={
          locations.find(
            (item) => item.locationIdentifier === location?.locationIdentifier
          ) || null
        }
        options={locations}
        renderInput={(params) => <TextField {...params} label="Location" />}
        autoHighlight={true}
        autoSelect={true}
        onChange={handleChange}
        selectOnFocus={true}
        getOptionLabel={(option) =>
          option.locationIdentifier +
          ' - ' +
          option.primaryName +
          ' @ ' +
          option.secondaryName
        }
        renderOption={(props, option, { inputValue }) => {
          const matches = match(
            option.locationIdentifier +
              ' - ' +
              option.primaryName +
              ' @ ' +
              option.secondaryName,
            inputValue,
            {
              insideWords: true,
            }
          )
          const parts = parse(
            option.locationIdentifier +
              ' - ' +
              option.primaryName +
              ' @ ' +
              option.secondaryName,
            matches
          )

          return (
            <li {...props} key={option.id}>
              <div>
                {parts.map((part, index) => (
                  <span
                    key={index}
                    style={{
                      fontWeight: part.highlight ? 700 : 400,
                    }}
                  >
                    {part.text}
                  </span>
                ))}
              </div>
            </li>
          )
        }}
      />
      <br />
    </Box>
  )
}
