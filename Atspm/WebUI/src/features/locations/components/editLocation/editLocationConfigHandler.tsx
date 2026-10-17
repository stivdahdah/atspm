import { Location, SearchLocation, useGetLocationFromKey } from '@/api/config'
import { sortApproachesByPhaseNumber } from '@/features/locations/components/editApproach/utils/sortApproaches'
import { useEffect, useState } from 'react'
import {
  readConfigLocation,
  type ConfigApproach,
  type ConfigLocation,
} from './editorModel'

interface LocationHandlerProps {
  location: Pick<SearchLocation, 'id'> | null
}

export type { ConfigApproach, ConfigDetector } from './editorModel'

export interface LocationConfigHandler {
  approaches: ConfigApproach[]
  expandedLocation: ConfigLocation | null
  updateApproaches: (approaches: ConfigApproach[]) => void
  updateExpandedLocation: (location: Location) => void
  handleAddNewApproach: () => void
  handleLocationEdit: (name: string, value: string) => void
  refetchLocation: () => void
}

export const useLocationConfigHandler = ({
  location,
}: LocationHandlerProps): LocationConfigHandler => {
  const [expandedLocation, setExpandedLocation] =
    useState<ConfigLocation | null>(null)
  const [approaches, setApproaches] = useState<ConfigApproach[]>([])

  const { data: expandedData, refetch: refetchLocation } =
    useGetLocationFromKey(
      location?.id ?? 0,
      {
        expand:
          'areas, devices, approaches($expand=Detectors($expand=DetectionTypes, detectorComments))',
      },
      { query: { enabled: location?.id != null } }
    )
  useEffect(() => {
    if (!expandedLocation) {
      setApproaches([])
      return
    }
    const existingApproaches = sortApproachesByPhaseNumber(
      expandedLocation.approaches.map((approach, index) => ({
        ...approach,
        index,
        open: false,
        isNew: false,
      }))
    )
    const newApproaches = approaches.filter((item) => item.isNew)
    setApproaches([...newApproaches, ...existingApproaches])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedLocation])

  useEffect(() => {
    const loaded = expandedData?.value[0]
    setExpandedLocation(loaded ? readConfigLocation(loaded) : null)
  }, [expandedData])

  const addNewApproach = () => {
    const id = Math.round(Math.random() * 10000)
    const index = approaches.length
    const newApproach: ConfigApproach = {
      id: id,
      index,
      description: 'New Approach',
      directionTypeId: 'NA',
      protectedPhaseNumber: null,
      isNew: true,
      detectors: [],
      isProtectedPhaseOverlap: false,
      isPermissivePhaseOverlap: false,
      isPedestrianPhaseOverlap: false,
      permissivePhaseNumber: null,
      pedestrianPhaseNumber: null,
      pedestrianDetectors: '',
      locationId: expandedLocation?.id,
      directionType: {
        id: 0,
        abbreviation: 'NA',
        description: 'Unknown',
        displayOrder: 0,
      },
    }

    setApproaches((prev) => [newApproach, ...prev])
  }

  const component: LocationConfigHandler = {
    approaches,
    expandedLocation,
    updateApproaches(approaches) {
      setApproaches(approaches)
      refetchLocation()
    },
    updateExpandedLocation(location) {
      setExpandedLocation(readConfigLocation(location))
    },
    handleAddNewApproach() {
      addNewApproach()
    },
    handleLocationEdit(name, value) {
      setExpandedLocation((previous) =>
        previous ? { ...previous, [name]: value } : null
      )
    },
    refetchLocation() {
      refetchLocation()
    },
  }

  return component
}
