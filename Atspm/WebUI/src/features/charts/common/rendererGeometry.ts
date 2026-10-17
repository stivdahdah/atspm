export function horizontalBounds(
  value: unknown
): { x: number; width: number } | null {
  if (
    !value ||
    typeof value !== 'object' ||
    !('x' in value) ||
    !('width' in value)
  )
    return null
  return typeof value.x === 'number' &&
    Number.isFinite(value.x) &&
    typeof value.width === 'number' &&
    Number.isFinite(value.width) &&
    value.width >= 0
    ? { x: value.x, width: value.width }
    : null
}
