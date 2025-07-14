import { useRef, useState } from 'react'
import { analyzeColorChart, type AnalysisResult } from '../lib/colorAnalysis'
import type { CardLayout } from '../lib/layoutCalculator'
import { getGridPosition } from '../lib/layoutCalculator'
import { generateArucoMarker } from '../lib/aruco'

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
  onCreateProfile?: (adjustments: Array<{color: string, adjustment: {r: number, g: number, b: number}}>, profileName: string, deviceName: string) => void
}

// Helper to wait for OpenCV to be ready
function waitForOpenCV(callback: () => void) {
  if ((window as any).cv && (window as any).cv.imread) {
    callback();
  } else {
    setTimeout(() => waitForOpenCV(callback), 100);
  }
}

function calculateColorDifference(color1: string, color2: string) {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)
  return {
    r: rgb2.r - rgb1.r,
    g: rgb2.g - rgb1.g,
    b: rgb2.b - rgb1.b
  }
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
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
  useArucoMarkers,
  margin,
  onCreateProfile
}: ColorComparisonProps) {
  const [profileName, setProfileName] = useState('')
  const [deviceName, setDeviceName] = useState('')
  const [showProfileCreator, setShowProfileCreator] = useState(false)
  const [showOverlay, setShowOverlay] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onImageUpload(file)
    }
  }

  const handleClearImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClearImage()
  }

  const handleCreateProfile = () => {
    if (!onCreateProfile || colorComparisons.length === 0) return
    
    // Convert color differences to adjustments
    const adjustments = colorComparisons.map((comparison) => ({
      color: comparison.original,
      adjustment: {
        r: -comparison.difference.r, // Invert to correct the difference
        g: -comparison.difference.g,
        b: -comparison.difference.b
      }
    }))
    
    onCreateProfile(adjustments, profileName, deviceName)
    setProfileName('')
    setDeviceName('')
    setShowProfileCreator(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Compare Original vs Printed Colors</h2>
        <p className="text-muted-foreground">Upload your scanned/photographed color chart to analyze differences.</p>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-medium mb-4">Original Colors (Card Layout)</h3>
          <div 
            className="aspect-[85.6/54] border-2 border-border rounded-lg overflow-hidden bg-white relative"
            style={{ height: '300px' }}
          >
            {/* Render entire grid using same logic as CardPreview */}
            {Array.from({ length: 77 }).map((_, gridIndex) => {
              const isMarkerPosition = useArucoMarkers && cardLayout.excludedIndices.includes(gridIndex)
              const gridPos = getGridPosition(cardLayout, gridIndex)
              
              if (isMarkerPosition) {
                // Render ArUco marker
                const markerData = cardLayout.markerPositions.find(m => m.gridIndex === gridIndex)
                if (!markerData) return null
                
                return (
                  <div
                    key={`marker-${gridIndex}`}
                    className="absolute border border-gray-800 bg-white"
                    style={{
                      left: `${(gridPos.x / cardLayout.cardWidth) * 100}%`,
                      top: `${(gridPos.y / cardLayout.cardHeight) * 100}%`,
                      width: `${(gridPos.width / cardLayout.cardWidth) * 100}%`,
                      height: `${(gridPos.height / cardLayout.cardHeight) * 100}%`,
                    }}
                  >
                    <div className="w-full h-full grid grid-cols-6 grid-rows-6 border border-black">
                      {Array.from({ length: 36 }).map((_, cellIdx) => {
                        const row = Math.floor(cellIdx / 6)
                        const col = cellIdx % 6
                        const marker = generateArucoMarker(markerData.id)
                        const isBlack = marker.matrix[row] && marker.matrix[row][col] === 0
                        return (
                          <div
                            key={cellIdx}
                            className={`${isBlack ? 'bg-black' : 'bg-white'}`}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              } else {
                // Render color swatch
                // Calculate swatch index
                let swatchIndex = 0
                for (let i = 0; i < gridIndex; i++) {
                  if (!cardLayout.excludedIndices.includes(i)) {
                    swatchIndex++
                  }
                }
                
                const color = colorChart[swatchIndex]
                
                // Only render if we have a color for this position
                if (swatchIndex >= colorChart.length) {
                  return (
                    <div
                      key={`empty-${gridIndex}`}
                      className="absolute"
                      style={{
                        left: `${(gridPos.x / cardLayout.cardWidth) * 100}%`,
                        top: `${(gridPos.y / cardLayout.cardHeight) * 100}%`,
                        width: `${(gridPos.width / cardLayout.cardWidth) * 100}%`,
                        height: `${(gridPos.height / cardLayout.cardHeight) * 100}%`,
                        backgroundColor: '#E5E7EB'
                      }}
                    />
                  )
                }
                
                return (
                  <div
                    key={`swatch-${gridIndex}`}
                    className="absolute"
                    style={{
                      left: `${(gridPos.x / cardLayout.cardWidth) * 100}%`,
                      top: `${(gridPos.y / cardLayout.cardHeight) * 100}%`,
                      width: `${(gridPos.width / cardLayout.cardWidth) * 100}%`,
                      height: `${(gridPos.height / cardLayout.cardHeight) * 100}%`,
                      backgroundColor: color || '#E5E7EB'
                    }}
                  />
                )
              }
            })}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-medium">Scanned Colors</h3>
            <div className="flex items-center gap-2">
              {scannedImage && (
                <>
                  <button
                    onClick={() => setShowOverlay(!showOverlay)}
                    className={`px-3 py-1 text-sm rounded ${showOverlay ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {showOverlay ? 'Hide' : 'Show'} Grid
                  </button>
                  <button
                    onClick={handleClearImage}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>
          {scannedImage ? (
            <div className="space-y-4">
              <div 
                className="relative aspect-[85.6/54]" 
                style={{ height: '300px' }}
              >
                <img 
                  src={scannedImage} 
                  alt="Scanned color chart" 
                  className="w-full h-full object-contain rounded-lg border-2 border-border"
                />
                {/* Show sampling grid overlay - conditionally show when image is present */}
                {showOverlay && (() => {
                  // If we have analysis results with detected markers, use them for alignment
                  const hasDetectedMarkers = analysisResult && analysisResult.detectedMarkers && analysisResult.detectedMarkers.length >= 3
                  
                  if (hasDetectedMarkers) {
                    // Use detected ArUco markers for precise alignment
                    return (
                      <div className="absolute inset-0 rounded-lg pointer-events-none">
                        <div className="relative w-full h-full flex items-center justify-center">
                          <div className="relative" style={{
                            aspectRatio: `${cardLayout.cardWidth}/${cardLayout.cardHeight}`,
                            maxWidth: '100%',
                            maxHeight: '100%'
                          }}>
                            {/* Show detected ArUco markers in green */}
                            {analysisResult.detectedMarkers.map((marker, idx) => {
                              // Find the corresponding expected marker position
                              const expectedMarker = cardLayout.markerPositions.find(m => m.id === marker.id)
                              if (!expectedMarker) return null
                              
                              const gridPos = getGridPosition(cardLayout, expectedMarker.gridIndex)
                              
                              return (
                                <div
                                  key={`detected-marker-${marker.id}`}
                                  className="absolute bg-green-500/80 border-2 border-green-600 rounded flex items-center justify-center text-white font-bold text-xs"
                                  style={{
                                    left: `${(gridPos.x / cardLayout.cardWidth) * 100}%`,
                                    top: `${(gridPos.y / cardLayout.cardHeight) * 100}%`,
                                    width: `${(gridPos.width / cardLayout.cardWidth) * 100}%`,
                                    height: `${(gridPos.height / cardLayout.cardHeight) * 100}%`,
                                  }}
                                >
                                  ✓{marker.id}
                                </div>
                              )
                            })}
                            
                            {/* Show color sampling grid */}
                            {Array.from({ length: 77 }).map((_, gridIndex) => {
                              const isMarkerPosition = cardLayout.excludedIndices.includes(gridIndex)
                              if (isMarkerPosition) return null
                              
                              const gridPos = getGridPosition(cardLayout, gridIndex)
                              let swatchIndex = 0
                              for (let i = 0; i < gridIndex; i++) {
                                if (!cardLayout.excludedIndices.includes(i)) {
                                  swatchIndex++
                                }
                              }
                              
                              if (swatchIndex >= colorChart.length) return null
                              
                              return (
                                <div
                                  key={`swatch-${gridIndex}`}
                                  className="absolute border-2 border-red-500 bg-red-500/30 flex items-center justify-center text-xs text-white font-bold shadow-lg"
                                  style={{
                                    left: `${(gridPos.x / cardLayout.cardWidth) * 100}%`,
                                    top: `${(gridPos.y / cardLayout.cardHeight) * 100}%`,
                                    width: `${(gridPos.width / cardLayout.cardWidth) * 100}%`,
                                    height: `${(gridPos.height / cardLayout.cardHeight) * 100}%`,
                                  }}
                                >
                                  {swatchIndex}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  }
                  
                  // Fallback to calculated positioning when no markers detected
                  const containerAspect = 85.6 / 54 
                  const cardAspect = cardLayout.cardWidth / cardLayout.cardHeight
                  
                  let overlayWidth, overlayHeight
                  if (containerAspect > cardAspect) {
                    overlayHeight = 300
                    overlayWidth = overlayHeight * cardAspect
                  } else {
                    overlayWidth = 300 * (85.6 / 54)
                    overlayHeight = overlayWidth / cardAspect
                  }
                  
                  return (
                    <div 
                      className="absolute rounded-lg pointer-events-none"
                      style={{
                        width: `${overlayWidth}px`,
                        height: `${overlayHeight}px`,
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                    {/* Grid overlay using actual card layout positioning */}
                    {Array.from({ length: 77 }).map((_, gridIndex) => {
                      const isMarkerPosition = cardLayout.excludedIndices.includes(gridIndex)
                      const gridPos = getGridPosition(cardLayout, gridIndex)
                      
                      // Convert from mm to percentage of card dimensions
                      const left = (gridPos.x / cardLayout.cardWidth) * 100
                      const top = (gridPos.y / cardLayout.cardHeight) * 100
                      const width = (gridPos.width / cardLayout.cardWidth) * 100
                      const height = (gridPos.height / cardLayout.cardHeight) * 100
                      
                      if (isMarkerPosition) {
                        // Show ArUco marker positions
                        return (
                          <div
                            key={`marker-${gridIndex}`}
                            className="absolute border-2 border-blue-500 bg-blue-500/30 flex items-center justify-center text-xs text-white font-bold"
                            style={{
                              left: `${left}%`,
                              top: `${top}%`,
                              width: `${width}%`,
                              height: `${height}%`,
                            }}
                          >
                            M{cardLayout.markerPositions.find(m => m.gridIndex === gridIndex)?.id}
                          </div>
                        )
                      }
                      
                      // Calculate swatch index
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
                })()}
              </div>
              {isAnalyzing ? (
                <div className="text-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground">Analyzing colors...</p>
                  <p className="text-xs text-muted-foreground">
                    Detecting ArUco markers and extracting color data
                  </p>
                </div>
              ) : colorComparisons.length > 0 ? (
                <div className="space-y-4">
                  {analysisResult && (
                    <div className="bg-muted/50 p-3 rounded-lg text-sm">
                      <h4 className="font-medium mb-2">Analysis Results</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>ArUco Markers: {analysisResult.detectedMarkers.length}/4</div>
                        <div>Rotation: {(analysisResult.transform.rotation * 180 / Math.PI).toFixed(1)}°</div>
                        <div>Colors Detected: {analysisResult.samples.length}/77</div>
                        <div>Avg Confidence: {(analysisResult.samples.reduce((sum, s) => sum + s.confidence, 0) / analysisResult.samples.length * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {/* Grid view of color comparisons */}
                    <div className="grid grid-cols-11 gap-1 p-4 bg-muted/20 rounded-lg">
                      {colorComparisons.map((comparison, idx) => {
                        const deltaE = Math.sqrt(
                          comparison.difference.r ** 2 + 
                          comparison.difference.g ** 2 + 
                          comparison.difference.b ** 2
                        )
                        const accuracy = deltaE < 10 ? 'good' : deltaE < 25 ? 'fair' : 'poor'
                        
                        return (
                          <div key={idx} className="aspect-square rounded-sm relative group cursor-pointer" title={`Swatch ${idx}: ΔE=${deltaE.toFixed(1)} (${accuracy})`}>
                            {/* Split color preview */}
                            <div className="w-full h-full relative overflow-hidden rounded-sm border border-gray-300">
                              <div 
                                className="absolute top-0 left-0 w-full h-1/2"
                                style={{ backgroundColor: comparison.original }}
                              />
                              <div 
                                className="absolute bottom-0 left-0 w-full h-1/2"
                                style={{ backgroundColor: comparison.scanned }}
                              />
                              {/* Accuracy indicator */}
                              <div className={`absolute top-0 right-0 w-2 h-2 rounded-bl ${
                                accuracy === 'good' ? 'bg-green-500' : 
                                accuracy === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
                              }`} />
                            </div>
                            {/* Tooltip on hover */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                              #{idx}: ΔE={deltaE.toFixed(1)}<br/>
                              Original: {comparison.original}<br/>
                              Scanned: {comparison.scanned}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    {/* Detailed list view */}
                    <details className="bg-muted/10 p-4 rounded-lg">
                      <summary className="cursor-pointer font-medium">Detailed Color Analysis</summary>
                      <div className="mt-4 max-h-[300px] overflow-y-auto space-y-1">
                        {colorComparisons.map((comparison, idx) => {
                          const deltaE = Math.sqrt(
                            comparison.difference.r ** 2 + 
                            comparison.difference.g ** 2 + 
                            comparison.difference.b ** 2
                          )
                          const accuracy = deltaE < 10 ? 'good' : deltaE < 25 ? 'fair' : 'poor'
                          
                          return (
                            <div key={idx} className="flex items-center gap-3 p-2 bg-background rounded text-sm">
                              <span className="w-8 text-center font-mono">{idx}</span>
                              <div className="flex gap-1">
                                <div style={{backgroundColor: comparison.original, width: 20, height: 20, borderRadius: 2}} title="Original" />
                                <div style={{backgroundColor: comparison.scanned, width: 20, height: 20, borderRadius: 2}} title="Scanned" />
                              </div>
                              <div className="flex-1 font-mono text-xs">
                                {comparison.original} → {comparison.scanned}
                              </div>
                              <div className="text-xs">
                                ΔE: {deltaE.toFixed(1)}
                              </div>
                              <div className={`text-xs font-medium w-12 text-center ${
                                accuracy === 'good' ? 'text-green-600' : 
                                accuracy === 'fair' ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {accuracy.toUpperCase()}
                              </div>
                              <div className="text-xs text-muted-foreground font-mono">
                                R{comparison.difference.r >= 0 ? '+' : ''}{comparison.difference.r} 
                                G{comparison.difference.g >= 0 ? '+' : ''}{comparison.difference.g} 
                                B{comparison.difference.b >= 0 ? '+' : ''}{comparison.difference.b}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </details>
                  </div>
                  
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <h4 className="font-medium mb-2">Calibration Summary</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {colorComparisons.filter(c => {
                            const deltaE = Math.sqrt(c.difference.r ** 2 + c.difference.g ** 2 + c.difference.b ** 2)
                            return deltaE < 10
                          }).length}
                        </div>
                        <div className="text-xs text-muted-foreground">Good Matches</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-yellow-600">
                          {colorComparisons.filter(c => {
                            const deltaE = Math.sqrt(c.difference.r ** 2 + c.difference.g ** 2 + c.difference.b ** 2)
                            return deltaE >= 10 && deltaE < 25
                          }).length}
                        </div>
                        <div className="text-xs text-muted-foreground">Fair Matches</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">
                          {colorComparisons.filter(c => {
                            const deltaE = Math.sqrt(c.difference.r ** 2 + c.difference.g ** 2 + c.difference.b ** 2)
                            return deltaE >= 25
                          }).length}
                        </div>
                        <div className="text-xs text-muted-foreground">Poor Matches</div>
                      </div>
                    </div>
                    <div className="mt-3 text-center">
                      <div className="text-sm font-medium">
                        Overall Accuracy: {((colorComparisons.filter(c => {
                          const deltaE = Math.sqrt(c.difference.r ** 2 + c.difference.g ** 2 + c.difference.b ** 2)
                          return deltaE < 25
                        }).length / colorComparisons.length) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  
                  {/* Profile Creation Section */}
                  {onCreateProfile && colorComparisons.length > 0 && (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-green-800">Create Printer Profile</h4>
                        <button
                          onClick={() => setShowProfileCreator(!showProfileCreator)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          {showProfileCreator ? 'Cancel' : 'Create Profile'}
                        </button>
                      </div>
                      
                      {showProfileCreator && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-green-800 mb-1">
                                Profile Name
                              </label>
                              <input
                                type="text"
                                value={profileName}
                                onChange={(e) => setProfileName(e.target.value)}
                                placeholder="e.g., Main Printer Calibration"
                                className="w-full px-3 py-2 border border-green-300 rounded-md text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-green-800 mb-1">
                                Device/Printer
                              </label>
                              <input
                                type="text"
                                value={deviceName}
                                onChange={(e) => setDeviceName(e.target.value)}
                                placeholder="e.g., Canon PIXMA Pro-100"
                                className="w-full px-3 py-2 border border-green-300 rounded-md text-sm"
                              />
                            </div>
                          </div>
                          
                          <div className="text-sm text-green-700">
                            This will create a profile with {colorComparisons.length} color adjustments based on the detected differences.
                          </div>
                          
                          <button
                            onClick={handleCreateProfile}
                            disabled={!profileName.trim() || !deviceName.trim()}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed"
                          >
                            Create Profile with {colorComparisons.length} Adjustments
                          </button>
                        </div>
                      )}
                      
                      {!showProfileCreator && (
                        <p className="text-sm text-green-700">
                          Ready to create a printer profile with {colorComparisons.length} color corrections based on your scan results.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <div 
              className="aspect-[85.6/54] border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center text-center p-4 bg-muted/10"
              style={{ height: '300px' }}
            >
              <div className="flex flex-col items-center justify-center space-y-3">
                <p className="text-muted-foreground font-medium">Upload a photo or scan of your printed color chart</p>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  className="block w-full max-w-xs text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  onChange={handleImageUpload}
                />
                <div className="text-center space-y-1">
                  <p className="text-sm text-muted-foreground">For best results, ensure good lighting and minimal glare</p>
                  <p className="text-xs text-muted-foreground">⚠️ Make sure the printed chart fills most of the image frame for accurate detection</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}