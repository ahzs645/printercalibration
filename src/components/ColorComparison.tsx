import { useState } from 'react'
import type { AnalysisResult } from '../lib/colorAnalysis'
import type { CardLayout } from '../lib/layoutCalculator'
import { 
  ImageContainer, 
  FileUpload, 
  AnalysisDisplay, 
  ControlPanel, 
  ColorGrid 
} from './color-comparison'

export interface ColorComparison {
  original: string
  scanned: string
  difference: {
    r: number
    g: number
    b: number
  }
}

interface ColorComparisonProps {
  colorChart: string[]
  cardLayout: CardLayout
  scannedImage: string | null
  isAnalyzing: boolean
  colorComparisons: ColorComparison[]
  analysisResult: AnalysisResult | null
  onImageUpload: (file: File) => void
  onClearImage: () => void
  canvasRef: React.RefObject<HTMLCanvasElement>
  useArucoMarkers: boolean
  margin: number
  onCreateProfile?: (
    adjustments: Array<{color: string, adjustment: {r: number, g: number, b: number}}>, 
    profileName: string, 
    deviceName: string
  ) => void
}

export function ColorComparison({
  colorChart,
  cardLayout,
  scannedImage,
  isAnalyzing,
  colorComparisons,
  analysisResult,
  onImageUpload,
  onClearImage,
  canvasRef,
  onCreateProfile
}: ColorComparisonProps) {
  const [showOverlay, setShowOverlay] = useState(true)
  const [debugMode, setDebugMode] = useState(false)
  const [manualMarkers, setManualMarkers] = useState<Array<{id: number, x: number, y: number}>>([])
  
  const handleDebugMarkerClick = (markerId: number, x: number, y: number) => {
    console.log(`Debug: Clicked marker ${markerId} at (${x.toFixed(0)}, ${y.toFixed(0)})`)
    
    // Update or add the marker
    setManualMarkers(prev => {
      const filtered = prev.filter(m => m.id !== markerId)
      return [...filtered, { id: markerId, x, y }]
    })
  }
  
  // Create modified analysis result with manual marker positions
  const getAnalysisResultWithManualMarkers = () => {
    if (!analysisResult || manualMarkers.length === 0) return analysisResult
    
    // Convert manual marker positions from display coordinates to canvas coordinates
    const canvasWidth = analysisResult.canvasDimensions?.width || 1284
    const canvasHeight = analysisResult.canvasDimensions?.height || 827
    
    // Get image container dimensions - we need to estimate this
    // For now, assume the image is displayed at a standard size
    const displayWidth = 600 // Approximate display width
    const displayHeight = 400 // Approximate display height
    
    const scaleX = canvasWidth / displayWidth
    const scaleY = canvasHeight / displayHeight
    
    const manualDetectedMarkers = manualMarkers.map(marker => ({
      id: marker.id,
      corners: [
        { x: marker.x * scaleX - 10, y: marker.y * scaleY - 10 }, // Top-left corner of marker
        { x: marker.x * scaleX + 10, y: marker.y * scaleY - 10 }, // Top-right corner
        { x: marker.x * scaleX - 10, y: marker.y * scaleY + 10 }, // Bottom-left corner
        { x: marker.x * scaleX + 10, y: marker.y * scaleY + 10 }  // Bottom-right corner
      ]
    }))
    
    console.log('Using manual markers:', manualDetectedMarkers)
    
    return {
      ...analysisResult,
      detectedMarkers: manualDetectedMarkers
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Expected Colors Section */}
      <div>
        <ColorGrid colorChart={colorChart} />
      </div>

      {/* Scanned Colors Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-medium">Scanned Colors</h3>
          {scannedImage && (
            <div className="flex items-center gap-4">
              <ControlPanel
                showOverlay={showOverlay}
                onToggleOverlay={() => setShowOverlay(!showOverlay)}
                onClearImage={onClearImage}
              />
              <button
                onClick={() => setDebugMode(!debugMode)}
                className={`px-3 py-1 text-sm rounded border ${
                  debugMode 
                    ? 'bg-yellow-500 text-white border-yellow-600' 
                    : 'bg-gray-100 text-gray-700 border-gray-300'
                }`}
              >
                {debugMode ? 'Exit Debug' : 'Debug Mode'}
              </button>
              {manualMarkers.length > 0 && (
                <span className="text-sm text-green-600">
                  {manualMarkers.length}/4 markers positioned
                </span>
              )}
            </div>
          )}
        </div>

        {scannedImage ? (
          <div className="space-y-4">
            <ImageContainer
              scannedImage={scannedImage}
              showOverlay={showOverlay}
              cardLayout={cardLayout}
              colorChart={colorChart}
              analysisResult={getAnalysisResultWithManualMarkers()}
              debugMode={debugMode}
              onDebugMarkerClick={handleDebugMarkerClick}
            />
            
            <AnalysisDisplay
              isAnalyzing={isAnalyzing}
              colorComparisons={colorComparisons}
              onCreateProfile={onCreateProfile}
            />
          </div>
        ) : (
          <FileUpload onImageUpload={onImageUpload} />
        )}
      </div>

      {/* Hidden canvas for analysis */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}