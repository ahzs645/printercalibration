import type { CardLayout } from '../../../lib/layoutCalculator'
import type { AnalysisResult } from '../../../lib/colorAnalysis'
import { getGridPosition } from '../../../lib/layoutCalculator'

interface GridOverlayProps {
  cardLayout: CardLayout
  colorChart: string[]
  analysisResult: AnalysisResult | null
  imageDimensions: {
    width: number
    height: number
    left: number
    top: number
  }
}

// Calculate perspective transform from detected markers
function calculatePerspectiveTransform(
  detectedMarkers: Array<{ id: number; corners: Array<{ x: number; y: number }> }>,
  cardLayout: CardLayout,
  imageDimensions: { width: number; height: number }
) {
  // Find markers by ID
  const marker0 = detectedMarkers.find(m => m.id === 0) // Top-left
  const marker1 = detectedMarkers.find(m => m.id === 1) // Top-right
  const marker2 = detectedMarkers.find(m => m.id === 2) // Bottom-left
  const marker3 = detectedMarkers.find(m => m.id === 3) // Bottom-right
  
  if (!marker0 || !marker1 || !marker2 || !marker3) {
    return null
  }
  
  // Get center of each marker (average of corners)
  const getMarkerCenter = (marker: { corners: Array<{ x: number; y: number }> }) => {
    const x = marker.corners.reduce((sum, c) => sum + c.x, 0) / 4
    const y = marker.corners.reduce((sum, c) => sum + c.y, 0) / 4
    return { x, y }
  }
  
  const p0 = getMarkerCenter(marker0)
  const p1 = getMarkerCenter(marker1)
  const p2 = getMarkerCenter(marker2)
  const p3 = getMarkerCenter(marker3)
  
  // Calculate scale factors
  const detectedWidth = Math.sqrt(Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2))
  const detectedHeight = Math.sqrt(Math.pow(p2.x - p0.x, 2) + Math.pow(p2.y - p0.y, 2))
  
  // Expected distances based on card layout
  const expectedWidth = cardLayout.markerPositions[1].x - cardLayout.markerPositions[0].x
  const expectedHeight = cardLayout.markerPositions[2].y - cardLayout.markerPositions[0].y
  
  return {
    topLeft: p0,
    topRight: p1,
    bottomLeft: p2,
    bottomRight: p3,
    scaleX: detectedWidth / expectedWidth,
    scaleY: detectedHeight / expectedHeight
  }
}

export function GridOverlay({ 
  cardLayout, 
  colorChart, 
  analysisResult, 
  imageDimensions 
}: GridOverlayProps) {
  // Check if we have detected markers for perspective correction
  const transform = analysisResult?.detectedMarkers && analysisResult.detectedMarkers.length >= 4
    ? calculatePerspectiveTransform(analysisResult.detectedMarkers, cardLayout, imageDimensions)
    : null
    
  return (
    <div 
      className="absolute pointer-events-none"
      style={{
        left: `${imageDimensions.left}px`,
        top: `${imageDimensions.top}px`,
        width: `${imageDimensions.width}px`,
        height: `${imageDimensions.height}px`,
      }}
    >
      {Array.from({ length: 77 }).map((_, gridIndex) => {
        const isMarkerPosition = cardLayout.excludedIndices.includes(gridIndex)
        const gridPos = getGridPosition(cardLayout, gridIndex)
        
        let left, top, width, height
        
        if (transform) {
          // Use perspective transform to calculate position
          // Bilinear interpolation based on the four corner markers
          const normalizedX = gridPos.x / cardLayout.cardWidth
          const normalizedY = gridPos.y / cardLayout.cardHeight
          
          // Interpolate position based on detected marker positions
          const x = transform.topLeft.x * (1 - normalizedX) * (1 - normalizedY) +
                   transform.topRight.x * normalizedX * (1 - normalizedY) +
                   transform.bottomLeft.x * (1 - normalizedX) * normalizedY +
                   transform.bottomRight.x * normalizedX * normalizedY
                   
          const y = transform.topLeft.y * (1 - normalizedX) * (1 - normalizedY) +
                   transform.topRight.y * normalizedX * (1 - normalizedY) +
                   transform.bottomLeft.y * (1 - normalizedX) * normalizedY +
                   transform.bottomRight.y * normalizedX * normalizedY
          
          // Convert to percentage of image dimensions
          left = (x / imageDimensions.width) * 100
          top = (y / imageDimensions.height) * 100
          width = (gridPos.width / cardLayout.cardWidth) * 100 * transform.scaleX
          height = (gridPos.height / cardLayout.cardHeight) * 100 * transform.scaleY
        } else {
          // Fallback to simple percentage-based positioning
          left = (gridPos.x / cardLayout.cardWidth) * 100
          top = (gridPos.y / cardLayout.cardHeight) * 100
          width = (gridPos.width / cardLayout.cardWidth) * 100
          height = (gridPos.height / cardLayout.cardHeight) * 100
        }
        
        if (isMarkerPosition) {
          // Check if this marker was detected
          const hasDetectedMarkers = analysisResult?.detectedMarkers?.length >= 3
          const markerPosition = cardLayout.markerPositions.find(m => m.gridIndex === gridIndex)
          const isDetected = hasDetectedMarkers && analysisResult?.detectedMarkers?.some(m => m.id === markerPosition?.id)
          
          return (
            <div
              key={`marker-${gridIndex}`}
              className={`absolute border-2 flex items-center justify-center text-xs text-white font-bold ${
                isDetected 
                  ? 'border-green-600 bg-green-500/80' 
                  : 'border-blue-500 bg-blue-500/30'
              }`}
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `${width}%`,
                height: `${height}%`,
              }}
            >
              {isDetected ? '✓' : 'M'}{markerPosition?.id}
            </div>
          )
        }
        
        // Calculate swatch index for color sampling positions
        let swatchIndex = 0
        for (let i = 0; i < gridIndex; i++) {
          if (!cardLayout.excludedIndices.includes(i)) {
            swatchIndex++
          }
        }
        
        if (swatchIndex >= colorChart.length) return null
        
        return (
          <div
            key={`sample-${gridIndex}`}
            className="absolute border-2 border-red-500 bg-red-500/30 flex items-center justify-center text-xs text-white font-bold shadow-lg"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${width}%`,
              height: `${height}%`,
            }}
          >
            {swatchIndex}
          </div>
        )
      })}
    </div>
  )
}