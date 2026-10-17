import {
  SearchLocation,
  useGetRouteDistance,
  useGetRouteRouteViewFromId,
  useUpsertRouteRoute,
} from '@/api/config'
import AuditInfo from '@/components/AuditInfo'
import { PageNames, useViewPage } from '@/features/identity/pagesCheck'
import SelectLocation from '@/features/locations/components/selectLocation/SelectLocation'
import RouteEditor from '@/features/routes/components/routeEditor'
import {
  createRouteLink,
  readEditableRoute,
  readRouteDistance,
  relinkRoute,
  routeToDto,
  type EditableRoute,
  type RouteEditorDistance,
  type RouteEditorLink,
} from '@/features/routes/components/routeEditor/editorModel'
import { ConfigEnum, useConfigEnums } from '@/hooks/useConfigEnums'
import { useNotificationStore } from '@/stores/notifications'
import { fetchRouteDistance } from '@/utils/fetchRouteDistance'
import { navigateToPage } from '@/utils/routes'
import { DropResult } from '@hello-pangea/dnd'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import { Box, Button, Paper, TextField } from '@mui/material'
import { useRouter } from 'next/router'
import React, { memo, useCallback, useEffect, useState } from 'react'

const RouteAdmin = () => {
  const pageAccess = useViewPage(PageNames.Routes)
  const { query } = useRouter()
  const rawId = Array.isArray(query.id) ? query.id[0] : query.id
  const routeId = Number(rawId)
  const { addNotification } = useNotificationStore()
  const { data: route } = useGetRouteRouteViewFromId<EditableRoute, Error>(
    routeId,
    undefined,
    {
      query: {
        enabled: Number.isInteger(routeId) && routeId > 0,
        select: readEditableRoute,
      },
    }
  )
  const { data: routeDistancesData } = useGetRouteDistance()
  const { mutateAsync: updateRoute } = useUpsertRouteRoute<Error>()
  const { data: directionTypes } = useConfigEnums(ConfigEnum.DirectionTypes)
  const [location, setLocation] = useState<SearchLocation | null>(null)
  const [routePolyline, setRoutePolyline] = useState<number[][]>([])
  const [updatedRoute, setUpdatedRoute] = useState<EditableRoute>()
  const [hasErrors, setHasErrors] = useState(false)
  const [routeDistances, setRouteDistances] = useState<RouteEditorDistance[]>(
    []
  )

  useEffect(() => {
    setUpdatedRoute(route)
  }, [route])
  useEffect(() => {
    if (routeDistancesData)
      setRouteDistances(
        routeDistancesData.value.flatMap((dto) => {
          const distance = readRouteDistance(dto)
          return distance ? [distance] : []
        })
      )
  }, [routeDistancesData])

  const fetchRouteDistanceAndUpdatePolyline = useCallback(
    async (links: RouteEditorLink[]) => {
      if (links.length < 2) {
        setRoutePolyline([])
        return
      }
      try {
        setRoutePolyline((await fetchRouteDistance(links)).shape)
      } catch {
        addNotification({
          type: 'error',
          title: 'Error fetching route distance',
        })
      }
    },
    [addNotification]
  )
  useEffect(() => {
    if (route) fetchRouteDistanceAndUpdatePolyline(route.routeLocations)
  }, [route, fetchRouteDistanceAndUpdatePolyline])

  if (!updatedRoute || pageAccess.isLoading) return null

  const updateLinks = (links: RouteEditorLink[]) => {
    const reconnected = relinkRoute(links, routeDistances)
    setUpdatedRoute((prev) =>
      prev ? { ...prev, routeLocations: reconnected } : prev
    )
    fetchRouteDistanceAndUpdatePolyline(reconnected)
  }
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const links = [...updatedRoute.routeLocations]
    const [moved] = links.splice(result.source.index, 1)
    if (!moved) return
    links.splice(result.destination.index, 0, moved)
    updateLinks(links)
  }
  const onAddRoute = () => {
    if (
      !location ||
      updatedRoute.routeLocations.some(
        (l) => l.locationIdentifier === location.locationIdentifier
      )
    )
      return
    updateLinks([
      ...updatedRoute.routeLocations,
      createRouteLink(
        location,
        updatedRoute.id,
        updatedRoute.routeLocations.length
      ),
    ])
    setLocation(null)
  }
  const handleDistanceChange = (identifier: string, distance: number) => {
    if (!Number.isFinite(distance) || distance < 0) return
    const index = updatedRoute.routeLocations.findIndex(
      (l) => l.locationIdentifier === identifier
    )
    const next = updatedRoute.routeLocations[index + 1]
    if (index < 0 || !next) return
    const existing = routeDistances.find(
      (d) =>
        d.locationIdentifierA === identifier &&
        d.locationIdentifierB === next.locationIdentifier
    )
    const newDistance: RouteEditorDistance = {
      ...existing,
      distance,
      locationIdentifierA: identifier,
      locationIdentifierB: next.locationIdentifier,
    }
    const distances = [
      ...routeDistances.filter((d) => d !== existing),
      newDistance,
    ]
    setRouteDistances(distances)
    setUpdatedRoute((prev) =>
      prev
        ? {
            ...prev,
            routeLocations: relinkRoute(prev.routeLocations, distances),
          }
        : prev
    )
  }
  const handleDirectionChange = (link: RouteEditorLink) => {
    setUpdatedRoute((prev) =>
      prev
        ? {
            ...prev,
            routeLocations: prev.routeLocations.map((l) =>
              l.locationIdentifier === link.locationIdentifier ? link : l
            ),
          }
        : prev
    )
  }
  const handleDeleteLink = (link: RouteEditorLink) => {
    updateLinks(
      updatedRoute.routeLocations.filter(
        (l) => l.locationIdentifier !== link.locationIdentifier
      )
    )
  }
  const handleEditRouteName = (event: React.ChangeEvent<HTMLInputElement>) => {
    const name = event.target.value
    setUpdatedRoute((prev) => (prev ? { ...prev, name } : prev))
  }
  const handleSaveRoute = async () => {
    if (!directionTypes) return
    try {
      const data = routeToDto(updatedRoute, directionTypes)
      setHasErrors(false)
      const saved = await updateRoute({ data })
      const loaded = readEditableRoute(saved)
      setUpdatedRoute(loaded)
      // Keep server-assigned distance IDs when this route is edited again.
      setRouteDistances((previous) => {
        const distances = [...previous]
        for (const link of loaded.routeLocations) {
          for (const distance of [
            link.previousLocationDistance,
            link.nextLocationDistance,
          ]) {
            if (!distance) continue
            const index = distances.findIndex(
              (d) =>
                d.locationIdentifierA === distance.locationIdentifierA &&
                d.locationIdentifierB === distance.locationIdentifierB
            )
            if (index < 0) distances.push(distance)
            else distances[index] = distance
          }
        }
        return distances
      })
      addNotification({ type: 'success', title: 'Route saved successfully' })
    } catch (error) {
      setHasErrors(true)
      addNotification({
        type: 'error',
        title: 'Error saving route',
        message:
          error instanceof Error ? error.message : 'Unable to save the route.',
      })
    }
  }

  return (
    <Box>
      <Box
        display="flex"
        flexDirection="column"
        width="200px"
        alignItems="start"
      >
        <Button
          onClick={() => navigateToPage('/admin/routes')}
          sx={{ pl: 0, mb: 2 }}
        >
          <ChevronLeftIcon /> Back to Routes
        </Button>
        <Box
          display="flex"
          flexDirection="row"
          minWidth={800}
          gap={2}
          alignContent={'center'}
          alignItems={'center'}
          mb={2}
        >
          <TextField
            label="Route Name"
            value={updatedRoute.name || ''}
            onChange={handleEditRouteName}
            sx={{ fontSize: '30px', minWidth: '250px' }}
          />
          <AuditInfo obj={updatedRoute} />
        </Box>
      </Box>
      <Box sx={{ display: 'flex' }}>
        <Paper sx={{ flexGrow: 1, minWidth: '400px', p: 3 }}>
          <SelectLocation
            location={location}
            setLocation={setLocation}
            route={routePolyline}
            center={
              routePolyline[Math.floor(routePolyline.length / 2)] as [
                number,
                number,
              ]
            }
            mapHeight="calc(100vh - 330px)"
          />
        </Paper>
        <RouteEditor
          hasErrors={hasErrors}
          route={updatedRoute}
          location={location}
          onAddRoute={onAddRoute}
          onDragEnd={onDragEnd}
          handleDistanceChange={handleDistanceChange}
          handleDirectionUpdate={handleDirectionChange}
          handleDeleteLink={handleDeleteLink}
          handleSaveRoute={handleSaveRoute}
        />
      </Box>
    </Box>
  )
}

export default memo(RouteAdmin)
