import type {
  CustomSeriesRenderItemAPI,
  CustomSeriesRenderItemParams,
} from 'echarts'

/** ECharts also permits non-Cartesian custom series; only Cartesian bounds can clip these rectangles. */
export function cartesianBounds(
  coordSys: CustomSeriesRenderItemParams['coordSys']
) {
  if (
    coordSys.type !== 'cartesian2d' ||
    !('x' in coordSys) ||
    typeof coordSys.x !== 'number' ||
    !('y' in coordSys) ||
    typeof coordSys.y !== 'number' ||
    !('width' in coordSys) ||
    typeof coordSys.width !== 'number' ||
    !('height' in coordSys) ||
    typeof coordSys.height !== 'number'
  )
    return undefined
  const { x, y, width, height } = coordSys
  if (![x, y, width, height].every(Number.isFinite)) return undefined
  return { x, y, width, height }
}
export function categoryBandSize(api: Pick<CustomSeriesRenderItemAPI, 'size'>) {
  const size = api.size?.([0, 1])
  return Array.isArray(size) && Number.isFinite(size[1])
    ? Math.abs(size[1])
    : undefined
}
