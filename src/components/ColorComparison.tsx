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
            <ControlPanel
              showOverlay={showOverlay}
              onToggleOverlay={() => setShowOverlay(!showOverlay)}
              onClearImage={onClearImage}
            />
          )}
        </div>

        {scannedImage ? (
          <div className="space-y-4">
            <ImageContainer
              scannedImage={scannedImage}
              showOverlay={showOverlay}
              cardLayout={cardLayout}
              colorChart={colorChart}
              analysisResult={analysisResult}
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