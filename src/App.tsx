import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { Button } from "./components/ui/button"
import { Slider } from "./components/ui/slider"
import { useState, useRef, useEffect } from "react"
import { generateArucoMarker, generateArucoSVG, type MarkerPosition } from "./lib/aruco"
import { analyzeColorChart, type AnalysisResult } from "./lib/colorAnalysis"
import { calculateCardLayout, getSwatchPosition, getGridPosition, type CardLayout } from "./lib/layoutCalculator"

interface ColorProfile {
  id: string
  name: string
  device: string
  created: string
  adjustments: {
    brightness: number
    contrast: number
    saturation: number
    red: number
    green: number
    blue: number
  }
}

interface ColorComparison {
  original: string
  scanned: string
  difference: {
    r: number
    g: number
    b: number
  }
}

interface TestPrintConfig {
  version: string
  name: string
  created: string
  settings: {
    useArucoMarkers: boolean
    margin: number
  }
  colorChart: string[]
  metadata: {
    cardDimensions: {
      width: number
      height: number
    }
    layout: CardLayout
  }
}

const DEFAULT_SWATCHES = [
  // Basic Colors
  "#FF0000", // Red
  "#00FF00", // Green
  "#0000FF", // Blue
  "#00FFFF", // Cyan
  "#FF00FF", // Magenta
  "#FFFF00", // Yellow
  "#FFA500", // Orange
  "#BFFF00", // Lime
  "#008080", // Teal
  "#800080", // Purple

  // Skin Tones
  "#FBE8D3", // Light
  "#F3C6A5",
  "#E0AC69",
  "#C68642",
  "#8D5524",
  "#5A3825", // Dark

  // Pastels
  "#FFB3BA", // Pink
  "#FFDFBA", // Peach
  "#FFFFBA", // Lemon
  "#BAFFC9", // Mint
  "#BAE1FF", // Sky blue
  "#E0BBE4", // Lavender
  "#D5F4E6", // Light aqua
  "#F6E2B3", // Light sand

  // Earthy Colors
  "#8B4513", // Saddle brown
  "#A0522D", // Sienna
  "#CD853F", // Peru
  "#D2B48C", // Tan
  "#556B2F", // Dark olive
  "#6B8E23", // Olive drab

  // Neutrals & Grays
  "#FFFFFF", // White
  "#E0E0E0",
  "#C0C0C0",
  "#A0A0A0",
  "#808080", // Middle gray
  "#606060",
  "#404040",
  "#303030",
  "#202020",
  "#000000", // Black

  // Red Ramp
  "#1A0000",
  "#330000",
  "#4D0000",
  "#660000",
  "#800000",
  "#990000",
  "#B30000",
  "#CC0000",
  "#E60000",
  "#FF0000",

  // Green Ramp
  "#001A00",
  "#003300",
  "#004D00",
  "#006600",
  "#008000",
  "#009900",
  "#00B300",
  "#00CC00",
  "#00E600",
  "#00FF00",

  // Blue Ramp
  "#00001A",
  "#000033",
  "#00004D",
  "#000066",
  "#000080",
  "#000099",
  "#0000B3",
  "#0000CC",
  "#0000E6",
  "#0000FF",
]

// Helper to wait for OpenCV to be ready
function waitForOpenCV(callback: () => void) {
  if ((window as any).cv && (window as any).cv.imread) {
    callback();
  } else {
    setTimeout(() => waitForOpenCV(callback), 100);
  }
}

function App() {
  const [activeTab, setActiveTab] = useState("swatch-generator")
  const [adjustments, setAdjustments] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    red: 0,
    green: 0,
    blue: 0
  })
  const [selectedColor, setSelectedColor] = useState("#4285f4")
  const [colorChart, setColorChart] = useState<string[]>(DEFAULT_SWATCHES)
  const [profiles, setProfiles] = useState<ColorProfile[]>(() => {
    const saved = localStorage.getItem('color-profiles')
    return saved ? JSON.parse(saved) : []
  })
  const [newProfileName, setNewProfileName] = useState("")
  const [newProfileDevice, setNewProfileDevice] = useState("")
  const [hoveredSwatch, setHoveredSwatch] = useState<number | null>(null)
  const [scannedImage, setScannedImage] = useState<string | null>(null)
  const [colorComparisons, setColorComparisons] = useState<ColorComparison[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [useArucoMarkers, setUseArucoMarkers] = useState(true)
  const [margin, setMargin] = useState(5) // mm margin from card edge
  const [cardLayout, setCardLayout] = useState<CardLayout>(() => calculateCardLayout(true, 5))

  useEffect(() => {
    // Update layout when marker settings change
    const newLayout = calculateCardLayout(useArucoMarkers, margin)
    setCardLayout(newLayout)
  }, [useArucoMarkers, margin])

  // Save profiles to localStorage
  useEffect(() => {
    localStorage.setItem('color-profiles', JSON.stringify(profiles))
  }, [profiles])

  // Save settings to localStorage
  useEffect(() => {
    const settings = {
      useArucoMarkers,
      margin,
      colorChart
    }
    localStorage.setItem('printer-calibration-settings', JSON.stringify(settings))
  }, [useArucoMarkers, margin, colorChart])

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('printer-calibration-settings')
    if (saved) {
      try {
        const settings = JSON.parse(saved)
        setUseArucoMarkers(settings.useArucoMarkers ?? true)
        setMargin(settings.margin ?? 5)
        if (settings.colorChart && Array.isArray(settings.colorChart)) {
          setColorChart(settings.colorChart)
        }
      } catch (error) {
        console.warn('Failed to load saved settings:', error)
      }
    }
  }, [])

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedColor(e.target.value)
  }

  const handleAddToChart = () => {
    const maxColors = useArucoMarkers ? 66 : 70 // 70 total - 4 corners when markers enabled
    if (colorChart.length >= maxColors) return
    setColorChart(prev => [...prev, selectedColor])
  }

  const getRGBValues = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgb(${r}, ${g}, ${b})`
  }

  const handleSaveProfile = () => {
    if (!newProfileName || !newProfileDevice) return

    const newProfile: ColorProfile = {
      id: Date.now().toString(),
      name: newProfileName,
      device: newProfileDevice,
      created: new Date().toLocaleDateString(),
      adjustments: { ...adjustments }
    }

    setProfiles(prev => [...prev, newProfile])
    setNewProfileName("")
    setNewProfileDevice("")
  }

  const handleResetAdjustments = () => {
    setAdjustments({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      red: 0,
      green: 0,
      blue: 0
    })
  }

  const handleLoadProfile = (profile: ColorProfile) => {
    setAdjustments(profile.adjustments)
  }

  const handleDeleteProfile = (profileId: string) => {
    setProfiles(prev => prev.filter(p => p.id !== profileId))
  }

  const applyAdjustments = (color: string) => {
    // Convert hex to RGB
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)

    // Apply adjustments
    const adjustedR = Math.max(0, Math.min(255, r + adjustments.red))
    const adjustedG = Math.max(0, Math.min(255, g + adjustments.green))
    const adjustedB = Math.max(0, Math.min(255, b + adjustments.blue))

    // Convert back to hex
    return `#${adjustedR.toString(16).padStart(2, '0')}${adjustedG.toString(16).padStart(2, '0')}${adjustedB.toString(16).padStart(2, '0')}`
  }

  const handleRemoveSwatch = (index: number) => {
    setColorChart(prev => prev.filter((_, i) => i !== index))
  }

  const handleReplaceSwatch = (index: number) => {
    setColorChart(prev => {
      const newChart = [...prev]
      newChart[index] = selectedColor
      return newChart
    })
  }

  const generateSVG = () => {
    const scale = 10 // Scale factor for SVG (mm to SVG units)
    const svgWidth = cardLayout.cardWidth * scale
    const svgHeight = cardLayout.cardHeight * scale

    // Generate ArUco markers
    const arucoMarkers = useArucoMarkers 
      ? cardLayout.markerPositions.map(pos => {
          const marker = generateArucoMarker(pos.id, pos.size * scale)
          const markerSVG = generateArucoSVG(marker)
          return `<g transform="translate(${pos.x * scale}, ${pos.y * scale})">${markerSVG}</g>`
        }).join('')
      : ''

    // Generate color swatches
    const swatches = colorChart.map((color, index) => {
      const pos = getSwatchPosition(cardLayout, index)
      if (!pos) return '' // Skip colors that don't fit
      return `<rect 
        x="${pos.x * scale}" 
        y="${pos.y * scale}" 
        width="${pos.width * scale}" 
        height="${pos.height * scale}" 
        fill="${color || '#E5E7EB'}"
      />`
    }).filter(swatch => swatch !== '').join('')

    const svgContent = `
      <svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
        ${swatches}
        ${arucoMarkers}
      </svg>
    `

    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'color-swatch-chart.svg'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const generatePDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf')
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [cardLayout.cardWidth, cardLayout.cardHeight] // CR80 card size
      })

      // Add white background
      pdf.setFillColor(255, 255, 255)
      pdf.rect(0, 0, cardLayout.cardWidth, cardLayout.cardHeight, 'F')

      // Add swatches
      colorChart.forEach((color, index) => {
        const pos = getSwatchPosition(cardLayout, index)
        if (!pos) return // Skip colors that don't fit

        if (color) {
          const rgb = hexToRgb(color)
          pdf.setFillColor(rgb.r, rgb.g, rgb.b)
        } else {
          pdf.setFillColor(229, 231, 235) // #E5E7EB
        }

        pdf.rect(pos.x, pos.y, pos.width, pos.height, 'F')
      })

      // Add ArUco markers
      if (useArucoMarkers) {
        cardLayout.markerPositions.forEach(pos => {
          const marker = generateArucoMarker(pos.id, 100) // Generate at high resolution
          const cellSize = pos.size / marker.matrix.length
          
          marker.matrix.forEach((row, i) => {
            row.forEach((cell, j) => {
              const x = pos.x + (j * cellSize)
              const y = pos.y + (i * cellSize)
              
              pdf.setFillColor(cell === 1 ? 255 : 0, cell === 1 ? 255 : 0, cell === 1 ? 255 : 0)
              pdf.rect(x, y, cellSize, cellSize, 'F')
            })
          })
        })
      }

      pdf.save('color-swatch-chart.pdf')
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
    }
  }

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setScannedImage(event.target?.result as string)
      analyzeImage(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const analyzeImage = async (imageData: string) => {
    setIsAnalyzing(true)
    const img = new window.Image()
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      try {
        // Use enhanced color analysis
        const result = analyzeColorChart(
          canvas,
          colorChart,
          { width: 85.6, height: 54 },
          { cols: 10, rows: 7 }
        )
        
        setAnalysisResult(result)
        
        // Create comparisons from analysis result
        const comparisons = colorChart.map((original, index) => {
          const sample = result.samples[index]
          const scanned = sample ? sample.color : '#E5E7EB'
          return {
            original,
            scanned,
            difference: calculateColorDifference(original, scanned)
          }
        })
        
        setColorComparisons(comparisons)
        setIsAnalyzing(false)
      } catch (error) {
        console.error('Enhanced analysis failed, falling back to basic method:', error)
        
        // Fallback to original method
        waitForOpenCV(() => {
          const cv = (window as any).cv
          const src = cv.imread(canvas)
          let gray = new cv.Mat()
          let thresh = new cv.Mat()
          cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0)
          cv.threshold(gray, thresh, 240, 255, cv.THRESH_BINARY)
          let contours = new cv.MatVector()
          let hierarchy = new cv.Mat()
          cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

          let boxes: {x: number, y: number, w: number, h: number}[] = []
          for (let i = 0; i < contours.size(); i++) {
            const rect = cv.boundingRect(contours.get(i))
            if (rect.width > img.width/20 && rect.width < img.width/5 && rect.height > img.height/20 && rect.height < img.height/5) {
              boxes.push(rect)
            }
          }
          
          boxes.sort((a, b) => {
            const rowA = Math.round(a.y / (img.height / 7))
            const rowB = Math.round(b.y / (img.height / 7))
            if (rowA === rowB) return a.x - b.x
            return rowA - rowB
          })
          
          const scannedColors: string[] = boxes.map(box => {
            const cx = Math.round(box.x + box.w/2)
            const cy = Math.round(box.y + box.h/2)
            const pixel = ctx.getImageData(cx, cy, 1, 1).data
            return `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`
          })
          
          while (scannedColors.length < 70) scannedColors.push('#E5E7EB')
          
          const comparisons = colorChart.map((original, index) => {
            const scanned = scannedColors[index] || '#E5E7EB'
            return {
              original,
              scanned,
              difference: calculateColorDifference(original, scanned)
            }
          })
          
          setColorComparisons(comparisons)
          setIsAnalyzing(false)
          src.delete(); gray.delete(); thresh.delete(); contours.delete(); hierarchy.delete();
        })
      }
    }
    img.src = imageData
  }

  const calculateColorDifference = (color1: string, color2: string) => {
    const rgb1 = hexToRgb(color1)
    const rgb2 = hexToRgb(color2)
    return {
      r: rgb2.r - rgb1.r,
      g: rgb2.g - rgb1.g,
      b: rgb2.b - rgb1.b
    }
  }

  const exportTestPrint = () => {
    const config: TestPrintConfig = {
      version: "1.3",
      name: `Test Print ${new Date().toLocaleDateString()}`,
      created: new Date().toISOString(),
      settings: {
        useArucoMarkers,
        margin
      },
      colorChart,
      metadata: {
        cardDimensions: {
          width: 85.6,
          height: 54
        },
        layout: cardLayout
      }
    }

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `test-print-config-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const importTestPrint = (file: File) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const config: TestPrintConfig = JSON.parse(event.target?.result as string)
        
        // Apply settings
        setUseArucoMarkers(config.settings.useArucoMarkers)
        setMargin(config.settings.margin || 5)
        setColorChart(config.colorChart)

        alert(`Successfully imported test print: ${config.name}`)
      } catch (error) {
        console.error('Error importing config:', error)
        alert('Invalid configuration file. Please check the file format.')
      }
    }
    reader.readAsText(file)
  }

  const exportProfiles = () => {
    const data = {
      version: "1.0",
      exported: new Date().toISOString(),
      profiles
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `color-profiles-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const importProfiles = (file: File) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        
        if (data.version !== "1.0") {
          alert("Unsupported profile format. Please use a newer version of this tool.")
          return
        }

        const importedProfiles: ColorProfile[] = data.profiles
        setProfiles(prev => [...prev, ...importedProfiles])
        
        alert(`Successfully imported ${importedProfiles.length} profiles`)
      } catch (error) {
        console.error('Error importing profiles:', error)
        alert('Invalid profile file. Please check the file format.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold mb-8">ID Card Color Calibration Tool</h1>
        
        <div className="bg-card rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">How to Calibrate Colors for ID Card Printing</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Generate a color swatch chart using the "Generate Swatch Chart" tab</li>
            <li>Print the chart on your ID card printer with color management turned OFF</li>
            <li>Take a photo or scan of the printed swatch card in good lighting</li>
            <li>Compare the original digital colors with your printed results</li>
            <li>Use the "Color Comparison" tab to analyze differences and create adjustments</li>
            <li>Apply these adjustments to future ID card designs to get accurate color reproduction</li>
          </ol>
        </div>
        
        <div className="bg-card rounded-lg shadow-lg p-6">
          <Tabs defaultValue="swatch-generator" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="swatch-generator">Generate Swatch Chart</TabsTrigger>
              <TabsTrigger value="color-comparison">Color Comparison</TabsTrigger>
              <TabsTrigger value="profile-manager">Profile Manager</TabsTrigger>
            </TabsList>
            
            <TabsContent value="swatch-generator" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">Generate Color Swatch Chart</h2>
                  <p className="text-muted-foreground">Create a custom color swatch chart to print on your ID cards.</p>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <input 
                    type="color" 
                    className="w-12 h-12 rounded cursor-pointer" 
                    value={selectedColor}
                    onChange={handleColorChange}
                  />
                  <div 
                    className="w-16 h-16 rounded border border-border" 
                    style={{ backgroundColor: selectedColor }}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="text-sm">HEX: <span className="font-mono">{selectedColor}</span></div>
                    <div className="text-sm">RGB: <span className="font-mono">{getRGBValues(selectedColor)}</span></div>
                  </div>
                  <Button 
                    onClick={handleAddToChart}
                    disabled={colorChart.length >= (useArucoMarkers ? 66 : 70)}
                  >
                    Add to Chart ({colorChart.length}/{useArucoMarkers ? 66 : 70})
                  </Button>
                </div>

                <div className="flex gap-8">
                  <div className="flex-1">
                    <h3 className="text-xl font-medium mb-4">Color Swatch Chart ({useArucoMarkers ? '66' : '70'} colors)</h3>
                    <div className="grid grid-cols-10 gap-1 p-4 bg-muted/20 rounded-lg">
                      {Array.from({ length: 70 }).map((_, gridIndex) => {
                        const isMarkerPosition = useArucoMarkers && cardLayout.excludedIndices.includes(gridIndex)
                        
                        if (isMarkerPosition) {
                          // Show marker placeholder
                          return (
                            <div 
                              key={gridIndex}
                              className="aspect-square border-2 border-gray-800 bg-gray-200 rounded-sm flex items-center justify-center"
                            >
                              <span className="text-xs font-bold text-gray-600">M{cardLayout.markerPositions.find(m => m.gridIndex === gridIndex)?.id}</span>
                            </div>
                          )
                        }
                        
                        // Calculate swatch index (excluding markers)
                        let swatchIndex = 0
                        for (let i = 0; i < gridIndex; i++) {
                          if (!cardLayout.excludedIndices.includes(i)) {
                            swatchIndex++
                          }
                        }
                        
                        const color = colorChart[swatchIndex]
                        
                        return (
                          <div 
                            key={gridIndex}
                            className="aspect-square border border-border relative group rounded-sm overflow-hidden"
                            style={{ backgroundColor: color || '#E5E7EB' }}
                            onMouseEnter={() => setHoveredSwatch(swatchIndex)}
                            onMouseLeave={() => setHoveredSwatch(null)}
                          >
                            {hoveredSwatch === swatchIndex && color && (
                              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1 p-1">
                                <Button 
                                  variant="secondary" 
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => handleReplaceSwatch(swatchIndex)}
                                >
                                  Replace
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => handleRemoveSwatch(swatchIndex)}
                                >
                                  Remove
                                </Button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="w-[300px]">
                    <h3 className="text-xl font-medium mb-4">CR80 Card Preview</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Card Margin</label>
                          <span className="text-sm font-mono">{margin}mm</span>
                        </div>
                        <Slider
                          value={[margin]}
                          onValueChange={([value]) => setMargin(value)}
                          min={2}
                          max={10}
                          step={0.5}
                        />
                        <p className="text-xs text-muted-foreground">
                          Distance from card edge to grid
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="use-aruco"
                            checked={useArucoMarkers}
                            onChange={(e) => setUseArucoMarkers(e.target.checked)}
                            className="rounded"
                          />
                          <label htmlFor="use-aruco" className="text-sm font-medium">
                            Add ArUco orientation markers
                          </label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Markers replace corner color swatches for better positioning
                        </p>
                      </div>
                      
                      
                      <div 
                        className="aspect-[85.6/54] border-2 border-border rounded-lg overflow-hidden bg-white relative"
                      >
                        {/* Render entire grid */}
                        {Array.from({ length: 70 }).map((_, gridIndex) => {
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
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>CR80 Card Size: 85.60 mm × 54.00 mm (3.375 in × 2.125 in)</p>
                        <p>Square Size: {cardLayout.swatchGrid.swatchWidth.toFixed(1)} mm × {cardLayout.swatchGrid.swatchHeight.toFixed(1)} mm</p>
                        <p>Grid: 10 × 7 ({useArucoMarkers ? '66 colors + 4 markers' : '70 colors'})</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4 flex-wrap">
                  <Button onClick={generateSVG}>Download SVG</Button>
                  <Button onClick={generatePDF}>Download PDF</Button>
                  <Button onClick={exportTestPrint}>Export Test Config</Button>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => e.target.files?.[0] && importTestPrint(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button variant="secondary">Import Test Config</Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="color-comparison" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">Compare Original vs Printed Colors</h2>
                  <p className="text-muted-foreground">Upload your scanned/photographed color chart to analyze differences.</p>
                </div>
                
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <p className="mb-2">Upload a photo or scan of your printed color chart</p>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    onChange={handleImageUpload}
                  />
                  <p className="text-sm text-muted-foreground mt-2">For best results, ensure good lighting and minimal glare</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-medium mb-4">Original Colors</h3>
                    <div className="grid grid-cols-10 gap-1 p-4 bg-muted/20 rounded-lg">
                      {colorChart.map((color, index) => (
                        <div 
                          key={index}
                          className="aspect-square rounded-sm"
                          style={{ backgroundColor: color || '#E5E7EB' }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium mb-4">Scanned Colors</h3>
                    {scannedImage ? (
                      <div className="space-y-4">
                        <img 
                          src={scannedImage} 
                          alt="Scanned color chart" 
                          className="w-full rounded-lg"
                        />
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
                                  <div>Colors Detected: {analysisResult.samples.length}/70</div>
                                  <div>Avg Confidence: {(analysisResult.samples.reduce((sum, s) => sum + s.confidence, 0) / analysisResult.samples.length * 100).toFixed(0)}%</div>
                                </div>
                              </div>
                            )}
                            
                            <div className="max-h-[400px] overflow-y-auto">
                              <div className="grid grid-cols-1 gap-2">
                                {colorComparisons.map((comparison, idx) => {
                                  const deltaE = Math.sqrt(
                                    comparison.difference.r ** 2 + 
                                    comparison.difference.g ** 2 + 
                                    comparison.difference.b ** 2
                                  )
                                  const accuracy = deltaE < 10 ? 'good' : deltaE < 25 ? 'fair' : 'poor'
                                  
                                  return (
                                    <div key={idx} className="flex items-center gap-3 p-2 bg-muted/20 rounded">
                                      <span className="text-xs w-6">{idx + 1}</span>
                                      <div style={{backgroundColor: comparison.original, width: 24, height: 24, borderRadius: 4}} />
                                      <div style={{backgroundColor: comparison.scanned, width: 24, height: 24, borderRadius: 4}} />
                                      <div className="flex-1 text-xs">
                                        <div>ΔE: {deltaE.toFixed(1)}</div>
                                        <div className={`font-medium ${
                                          accuracy === 'good' ? 'text-green-600' : 
                                          accuracy === 'fair' ? 'text-yellow-600' : 'text-red-600'
                                        }`}>
                                          {accuracy.toUpperCase()}
                                        </div>
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        R{comparison.difference.r >= 0 ? '+' : ''}{comparison.difference.r} 
                                        G{comparison.difference.g >= 0 ? '+' : ''}{comparison.difference.g} 
                                        B{comparison.difference.b >= 0 ? '+' : ''}{comparison.difference.b}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
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
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="w-full h-[300px] border border-border rounded-lg flex items-center justify-center text-muted-foreground">
                        <p>Upload an image to see preview</p>
                      </div>
                    )}
                  </div>
                </div>

                <canvas ref={canvasRef} className="hidden" />
              </div>
            </TabsContent>
            
            <TabsContent value="profile-manager" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">Color Profile Manager</h2>
                  <p className="text-muted-foreground">Create and manage color adjustment profiles for different print jobs.</p>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-medium mb-4">Color Adjustment Settings</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Brightness</label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[adjustments.brightness]}
                            onValueChange={([value]) => setAdjustments(prev => ({ ...prev, brightness: value }))}
                            min={-50}
                            max={50}
                            step={1}
                          />
                          <span className="text-sm font-mono w-12 text-right">{adjustments.brightness}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Contrast</label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[adjustments.contrast]}
                            onValueChange={([value]) => setAdjustments(prev => ({ ...prev, contrast: value }))}
                            min={-50}
                            max={50}
                            step={1}
                          />
                          <span className="text-sm font-mono w-12 text-right">{adjustments.contrast}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Saturation</label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[adjustments.saturation]}
                            onValueChange={([value]) => setAdjustments(prev => ({ ...prev, saturation: value }))}
                            min={-50}
                            max={50}
                            step={1}
                          />
                          <span className="text-sm font-mono w-12 text-right">{adjustments.saturation}</span>
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-medium mt-8 mb-4">Channel Adjustments</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Red</label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[adjustments.red]}
                            onValueChange={([value]) => setAdjustments(prev => ({ ...prev, red: value }))}
                            min={-50}
                            max={50}
                            step={1}
                          />
                          <span className="text-sm font-mono w-12 text-right">{adjustments.red}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Green</label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[adjustments.green]}
                            onValueChange={([value]) => setAdjustments(prev => ({ ...prev, green: value }))}
                            min={-50}
                            max={50}
                            step={1}
                          />
                          <span className="text-sm font-mono w-12 text-right">{adjustments.green}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Blue</label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[adjustments.blue]}
                            onValueChange={([value]) => setAdjustments(prev => ({ ...prev, blue: value }))}
                            min={-50}
                            max={50}
                            step={1}
                          />
                          <span className="text-sm font-mono w-12 text-right">{adjustments.blue}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xl font-medium mb-4">Original</h3>
                      <div className="w-full h-32 rounded-lg border border-border" style={{ backgroundColor: selectedColor }} />
                      <div className="mt-2 text-sm font-mono">HEX: {selectedColor}</div>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-medium mb-4">Adjusted (Print Preview)</h3>
                      <div className="w-full h-32 rounded-lg border border-border" style={{ backgroundColor: applyAdjustments(selectedColor) }} />
                      <div className="mt-2 text-sm font-mono">HEX: {applyAdjustments(selectedColor)}</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-4">
                      <input
                        type="text"
                        placeholder="Profile Name"
                        className="w-full px-3 py-2 border rounded-md"
                        value={newProfileName}
                        onChange={(e) => setNewProfileName(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Device Name"
                        className="w-full px-3 py-2 border rounded-md"
                        value={newProfileDevice}
                        onChange={(e) => setNewProfileDevice(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleSaveProfile}>Save Profile</Button>
                    <Button variant="secondary" onClick={handleResetAdjustments}>Reset Adjustments</Button>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-medium">Saved Profiles</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={exportProfiles}>
                        Export All Profiles
                      </Button>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".json"
                          onChange={(e) => e.target.files?.[0] && importProfiles(e.target.files[0])}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Button variant="outline">Import Profiles</Button>
                      </div>
                    </div>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted">
                          <th className="px-4 py-2 text-left font-medium">Profile Name</th>
                          <th className="px-4 py-2 text-left font-medium">Device</th>
                          <th className="px-4 py-2 text-left font-medium">Created</th>
                          <th className="px-4 py-2 text-left font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {profiles.map(profile => (
                          <tr key={profile.id}>
                            <td className="px-4 py-2">{profile.name}</td>
                            <td className="px-4 py-2">{profile.device}</td>
                            <td className="px-4 py-2">{profile.created}</td>
                            <td className="px-4 py-2">
                              <div className="flex gap-2">
                                <Button variant="secondary" size="sm" onClick={() => handleLoadProfile(profile)}>
                                  Load
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteProfile(profile.id)}>
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default App
