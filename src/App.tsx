import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { Button } from "./components/ui/button"
import { Slider } from "./components/ui/slider"
import { useState, useRef } from "react"

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
  const [profiles, setProfiles] = useState<ColorProfile[]>([])
  const [newProfileName, setNewProfileName] = useState("")
  const [newProfileDevice, setNewProfileDevice] = useState("")
  const [hoveredSwatch, setHoveredSwatch] = useState<number | null>(null)
  const [cardMargin, setCardMargin] = useState(16) // Default margin in pixels
  const [scannedImage, setScannedImage] = useState<string | null>(null)
  const [colorComparisons, setColorComparisons] = useState<ColorComparison[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedColor(e.target.value)
  }

  const handleAddToChart = () => {
    if (colorChart.length >= 70) return // Limit to 10x7 grid
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
    const svgWidth = 85.6 * 10
    const svgHeight = 54 * 10
    const gap = 1 * 10
    const swatchWidth = (svgWidth - (cardMargin * 2) - (gap * 9)) / 10
    const swatchHeight = (svgHeight - (cardMargin * 2) - (gap * 6)) / 7

    // Add reference markers in the corners
    const markers = [
      { x: cardMargin, y: cardMargin, color: '#FF0000' }, // Top-left (red)
      { x: svgWidth - cardMargin - 5, y: cardMargin, color: '#00FF00' }, // Top-right (green)
      { x: cardMargin, y: svgHeight - cardMargin - 5, color: '#0000FF' }, // Bottom-left (blue)
      { x: svgWidth - cardMargin - 5, y: svgHeight - cardMargin - 5, color: '#FFFF00' } // Bottom-right (yellow)
    ]

    const svgContent = `
      <svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
        ${markers.map(marker => `
          <rect 
            x="${marker.x}" 
            y="${marker.y}" 
            width="5" 
            height="5" 
            fill="${marker.color}"
          />
        `).join('')}
        ${colorChart.map((color, index) => {
          const row = Math.floor(index / 10)
          const col = index % 10
          const x = cardMargin + (col * (swatchWidth + gap))
          const y = cardMargin + (row * (swatchHeight + gap))
          return `<rect 
            x="${x}" 
            y="${y}" 
            width="${swatchWidth}" 
            height="${swatchHeight}" 
            fill="${color || '#E5E7EB'}"
          />`
        }).join('')}
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
        format: [85.6, 54] // CR80 card size
      })

      const gap = 1 // 1mm gap
      const swatchWidth = (85.6 - (cardMargin * 2) - (gap * 9)) / 10
      const swatchHeight = (54 - (cardMargin * 2) - (gap * 6)) / 7

      // Add white background
      pdf.setFillColor(255, 255, 255)
      pdf.rect(0, 0, 85.6, 54, 'F')

      // Add swatches
      colorChart.forEach((color, index) => {
        const row = Math.floor(index / 10)
        const col = index % 10
        const x = cardMargin + (col * (swatchWidth + gap))
        const y = cardMargin + (row * (swatchHeight + gap))

        if (color) {
          const rgb = hexToRgb(color)
          pdf.setFillColor(rgb.r, rgb.g, rgb.b)
        } else {
          pdf.setFillColor(229, 231, 235) // #E5E7EB
        }

        pdf.rect(x, y, swatchWidth, swatchHeight, 'F')
      })

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
    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Set canvas size to match image
      canvas.width = img.width
      canvas.height = img.height

      // Draw image
      ctx.drawImage(img, 0, 0)

      // Find reference markers
      const markers = findReferenceMarkers(ctx, canvas.width, canvas.height)
      if (!markers) {
        alert('Could not find reference markers. Please ensure the image is clear and properly oriented.')
        setIsAnalyzing(false)
        return
      }

      // Calculate transformation matrix
      const matrix = calculateTransformationMatrix(markers, canvas.width, canvas.height)

      // Sample colors from the image
      const scannedColors = sampleColors(ctx, matrix)

      // Compare colors
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
    }
    img.src = imageData
  }

  const findReferenceMarkers = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Sample pixels at the corners to find the reference markers
    const corners = [
      { x: 0, y: 0 }, // Top-left
      { x: width - 1, y: 0 }, // Top-right
      { x: 0, y: height - 1 }, // Bottom-left
      { x: width - 1, y: height - 1 } // Bottom-right
    ]

    return corners.map(corner => {
      const pixel = ctx.getImageData(corner.x, corner.y, 1, 1).data
      return { x: corner.x, y: corner.y, color: `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}` }
    })
  }

  const calculateTransformationMatrix = (markers: { x: number, y: number, color: string }[], width: number, height: number) => {
    // Calculate the transformation matrix based on the reference markers
    // This will help us map the scanned image coordinates to the original chart coordinates
    // For now, return a simple identity matrix
    return {
      a: 1, b: 0, c: 0, d: 1, e: 0, f: 0
    }
  }

  const sampleColors = (ctx: CanvasRenderingContext2D, matrix: { a: number, b: number, c: number, d: number, e: number, f: number }) => {
    const colors: string[] = []
    const gap = 1
    const swatchWidth = (85.6 - (cardMargin * 2) - (gap * 9)) / 10
    const swatchHeight = (54 - (cardMargin * 2) - (gap * 6)) / 7

    // Sample colors from the image using the transformation matrix
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 10; col++) {
        const x = cardMargin + (col * (swatchWidth + gap)) + (swatchWidth / 2)
        const y = cardMargin + (row * (swatchHeight + gap)) + (swatchHeight / 2)

        // Apply transformation matrix
        const transformedX = matrix.a * x + matrix.c * y + matrix.e
        const transformedY = matrix.b * x + matrix.d * y + matrix.f

        const pixel = ctx.getImageData(transformedX, transformedY, 1, 1).data
        colors.push(`#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`)
      }
    }

    return colors
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
                    disabled={colorChart.length >= 70}
                  >
                    Add to Chart
                  </Button>
                </div>

                <div className="flex gap-8">
                  <div className="flex-1">
                    <h3 className="text-xl font-medium mb-4">Color Swatch Chart</h3>
                    <div className="grid grid-cols-10 gap-1 p-4 bg-muted/20 rounded-lg">
                      {Array.from({ length: 70 }).map((_, index) => (
                        <div 
                          key={index}
                          className="aspect-square border border-border relative group rounded-sm overflow-hidden"
                          style={{ backgroundColor: colorChart[index] || '#E5E7EB' }}
                          onMouseEnter={() => setHoveredSwatch(index)}
                          onMouseLeave={() => setHoveredSwatch(null)}
                        >
                          {hoveredSwatch === index && (
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1 p-1">
                              <Button 
                                variant="secondary" 
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => handleReplaceSwatch(index)}
                              >
                                Replace
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => handleRemoveSwatch(index)}
                              >
                                Remove
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="w-[300px]">
                    <h3 className="text-xl font-medium mb-4">CR80 Card Preview</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Card Margin</label>
                          <span className="text-sm font-mono">{cardMargin}px</span>
                        </div>
                        <Slider
                          value={[cardMargin]}
                          onValueChange={([value]) => setCardMargin(value)}
                          min={0}
                          max={32}
                          step={1}
                        />
                      </div>
                      <div 
                        className="aspect-[85.6/54] border-2 border-border rounded-lg overflow-hidden bg-muted/20"
                        style={{ padding: `${cardMargin}px` }}
                      >
                        <div className="grid grid-cols-10 grid-rows-7 gap-0.5 h-full">
                          {Array.from({ length: 70 }).map((_, index) => (
                            <div 
                              key={index}
                              className="border border-border rounded-sm"
                              style={{ backgroundColor: colorChart[index] || '#E5E7EB' }}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        CR80 Card Size: 85.60 mm × 54.00 mm (3.375 in × 2.125 in)
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <Button onClick={generateSVG}>Download SVG</Button>
                  <Button onClick={generatePDF}>Download PDF</Button>
                  <Button>Print Chart</Button>
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
                          <p className="text-center text-muted-foreground">Analyzing colors...</p>
                        ) : colorComparisons.length > 0 ? (
                          <div className="grid grid-cols-10 gap-1 p-4 bg-muted/20 rounded-lg">
                            {colorComparisons.map((comparison, index) => (
                              <div 
                                key={index}
                                className="aspect-square rounded-sm relative group"
                                style={{ backgroundColor: comparison.scanned }}
                              >
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-xs text-white">
                                  <div>Original: {comparison.original}</div>
                                  <div>Scanned: {comparison.scanned}</div>
                                  <div>Diff: R{comparison.difference.r} G{comparison.difference.g} B{comparison.difference.b}</div>
                                </div>
                              </div>
                            ))}
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
                  <h3 className="text-xl font-medium mb-4">Saved Profiles</h3>
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
