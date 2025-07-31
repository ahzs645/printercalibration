import { useRef } from 'react'
import { GridOverlay } from './GridOverlay'
import { useImageOverlay } from '../hooks/useImageOverlay'
import type { CardLayout } from '../../../lib/layoutCalculator'
import type { AnalysisResult } from '../../../lib/colorAnalysis'

interface ImageContainerProps {
  scannedImage: string
  showOverlay: boolean
  cardLayout: CardLayout
  colorChart: string[]
  analysisResult: AnalysisResult | null
}

export function ImageContainer({
  scannedImage,
  showOverlay,
  cardLayout,
  colorChart,
  analysisResult
}: ImageContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const { imageDimensions } = useImageOverlay(containerRef, imageRef)

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[300px] bg-gray-100 rounded-lg border-2 border-border overflow-hidden"
    >
      <img 
        ref={imageRef}
        src={scannedImage} 
        alt="Scanned color chart" 
        className="w-full h-full object-contain"
      />
      {showOverlay && imageDimensions && (
        <GridOverlay
          cardLayout={cardLayout}
          colorChart={colorChart}
          analysisResult={analysisResult}
          imageDimensions={imageDimensions}
        />
      )}
    </div>
  )
}