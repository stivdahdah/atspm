import type {
  RouteDistanceDto,
  RouteDto,
  RouteLocationDto,
  SearchLocation,
} from '@/api/config'

export type RouteEditorDistance = RouteDistanceDto & {
  distance: number
  locationIdentifierA: string
  locationIdentifierB: string
}
export type RouteEditorLink = Omit<
  RouteLocationDto,
  | 'order'
  | 'locationIdentifier'
  | 'primaryDirectionId'
  | 'opposingDirectionId'
  | 'primaryPhase'
  | 'opposingPhase'
  | 'nextLocationDistance'
  | 'previousLocationDistance'
> & {
  order: number
  locationIdentifier: string
  primaryDirectionId: number | string | null
  opposingDirectionId: number | string | null
  primaryPhase: number | null
  opposingPhase: number | null
  nextLocationDistance: RouteEditorDistance | null
  previousLocationDistance: RouteEditorDistance | null
}
export type EditableRoute = Omit<RouteDto, 'id' | 'name' | 'routeLocations'> & {
  id: number
  name: string
  routeLocations: RouteEditorLink[]
}
export type DirectionMember = { name: string; value: number }

export function readRouteDistance(
  distance?: RouteDistanceDto | null
): RouteEditorDistance | null {
  if (!distance) return null
  if (
    distance.distance == null ||
    !Number.isFinite(distance.distance) ||
    !distance.locationIdentifierA ||
    !distance.locationIdentifierB
  ) {
    throw new Error('The route distance is incomplete.')
  }
  return {
    ...distance,
    distance: distance.distance,
    locationIdentifierA: distance.locationIdentifierA,
    locationIdentifierB: distance.locationIdentifierB,
  }
}

export function readEditableRoute(dto: RouteDto): EditableRoute {
  if (dto.id == null || !Number.isInteger(dto.id) || dto.id <= 0) {
    throw new Error('The route response is missing its ID.')
  }
  return {
    ...dto,
    id: dto.id,
    name: dto.name ?? '',
    routeLocations: (dto.routeLocations ?? [])
      .map((link, index) => {
        if (!link.locationIdentifier)
          throw new Error('A route location is missing its identifier.')
        return {
          ...link,
          order: link.order ?? index,
          locationIdentifier: link.locationIdentifier,
          primaryDirectionId: link.primaryDirectionId ?? null,
          opposingDirectionId: link.opposingDirectionId ?? null,
          primaryPhase: link.primaryPhase ?? null,
          opposingPhase: link.opposingPhase ?? null,
          nextLocationDistance: readRouteDistance(link.nextLocationDistance),
          previousLocationDistance: readRouteDistance(
            link.previousLocationDistance
          ),
        }
      })
      .sort((a, b) => a.order - b.order),
  }
}

export function createRouteLink(
  location: SearchLocation,
  routeId: number,
  order: number
): RouteEditorLink {
  if (!location.locationIdentifier)
    throw new Error('Select a location with an identifier.')
  return {
    routeId,
    locationId: location.id,
    locationIdentifier: location.locationIdentifier,
    primaryName: location.primaryName,
    secondaryName: location.secondaryName,
    latitude: location.latitude,
    longitude: location.longitude,
    order,
    primaryPhase: null,
    opposingPhase: null,
    primaryDirectionId: null,
    opposingDirectionId: null,
    isPrimaryOverlap: false,
    isOpposingOverlap: false,
    nextLocationDistance: null,
    previousLocationDistance: null,
    nextLocationDistanceId: null,
    previousLocationDistanceId: null,
  }
}

/** Rebuild both sides of every adjacency without mutating query-cache objects. */
export function relinkRoute(
  locations: RouteEditorLink[],
  distances: RouteEditorDistance[]
): RouteEditorLink[] {
  const find = (
    a: RouteEditorLink | undefined,
    b: RouteEditorLink | undefined
  ) =>
    a && b
      ? (distances.find(
          (d) =>
            d.locationIdentifierA === a.locationIdentifier &&
            d.locationIdentifierB === b.locationIdentifier
        ) ?? null)
      : null
  return locations.map((link, index) => {
    const previous = find(locations[index - 1], link)
    const next = find(link, locations[index + 1])
    return {
      ...link,
      order: index,
      previousLocationDistance: previous,
      previousLocationDistanceId: previous?.id ?? null,
      nextLocationDistance: next,
      nextLocationDistanceId: next?.id ?? null,
    }
  })
}

export function routeToDto(
  route: EditableRoute,
  directions: DirectionMember[]
): RouteDto {
  const directionValue = (value: number | string | null) => {
    const member = directions.find((d) => d.value === value || d.name === value)
    if (!member || member.value === 0)
      throw new Error('Both route directions are required.')
    return member.value
  }
  return {
    ...route,
    routeLocations: route.routeLocations.map((link, index) => {
      if (link.primaryPhase == null || link.opposingPhase == null)
        throw new Error('Both route phases are required.')
      if (
        index < route.routeLocations.length - 1 &&
        !link.nextLocationDistance
      ) {
        throw new Error('A distance to the next location is required.')
      }
      return {
        ...link,
        order: index,
        primaryDirectionId: directionValue(link.primaryDirectionId),
        opposingDirectionId: directionValue(link.opposingDirectionId),
        primaryPhase: link.primaryPhase,
        opposingPhase: link.opposingPhase,
        isPrimaryOverlap: link.isPrimaryOverlap ?? false,
        isOpposingOverlap: link.isOpposingOverlap ?? false,
        nextLocationDistance: link.nextLocationDistance ?? undefined,
        previousLocationDistance: link.previousLocationDistance ?? undefined,
      }
    }),
  }
}
