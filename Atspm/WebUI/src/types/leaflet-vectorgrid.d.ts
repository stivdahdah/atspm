import type { GeoJSON as GeoJsonData, GeoJsonProperties } from 'geojson'
import type { PathOptions } from 'leaflet'
import 'leaflet.vectorgrid'

// VectorGrid supports string feature IDs and style callbacks. The installed
// plugin implements both in Leaflet.VectorGrid.js; its published types omit them.
type FeatureStyle = (properties: GeoJsonProperties, zoom: number) => PathOptions

declare module 'leaflet' {
  interface VectorGrid {
    setFeatureStyle(id: string, style: PathOptions | FeatureStyle): this
    resetFeatureStyle(id: string): this
  }
  namespace vectorGrid {
    function slicer(
      data: GeoJsonData,
      options: Omit<
        VectorGrid.SlicerOptions,
        'vectorTileLayerStyles' | 'getFeatureId'
      > & {
        vectorTileLayerStyles?: Record<string, PathOptions | FeatureStyle>
        getFeatureId?: (feature: {
          properties: Record<string, string>
        }) => string
      }
    ): VectorGrid.Slicer
  }
}
