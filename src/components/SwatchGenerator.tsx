import { Button } from "./ui/button"
import { ColorSwatchChart } from "./ColorSwatchChart"
import { CardPreview } from "./CardPreview"
import { generateSVG, generatePDF, exportTestPrint, importTestPrint, type TestPrintConfig } from "../lib/exportUtils"
import type { CardLayout } from "../lib/layoutCalculator"

interface SwatchGeneratorProps {
  selectedColor: string
  setSelectedColor: (color: string) => void
  colorChart: string[]
  useArucoMarkers: boolean
  margin: number
  cardLayout: CardLayout
  hoveredSwatch: number | null
  onSwatchHover: (index: number | null) => void
  onAddToChart: () => void
  onReplaceSwatch: (index: number) => void
  onRemoveSwatch: (index: number) => void
  onMarginChange: (value: number) => void
  onArucoToggle: (value: boolean) => void
  getRGBValues: (hex: string) => string
  setUseArucoMarkers: (value: boolean) => void
  setMargin: (value: number) => void
  setColorChart: (value: string[]) => void
}

export function SwatchGenerator({
  selectedColor,
  setSelectedColor,
  colorChart,
  useArucoMarkers,
  margin,
  cardLayout,
  hoveredSwatch,
  onSwatchHover,
  onAddToChart,
  onReplaceSwatch,
  onRemoveSwatch,
  onMarginChange,
  onArucoToggle,
  getRGBValues,
  setUseArucoMarkers,
  setMargin,
  setColorChart
}: SwatchGeneratorProps) {
  
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedColor(e.target.value)
  }

  const handleExportTestPrint = () => {
    exportTestPrint(useArucoMarkers, margin, colorChart, cardLayout)
  }

  const handleImportTestPrint = (file: File) => {
    importTestPrint(
      file,
      (config: TestPrintConfig) => {
        setUseArucoMarkers(config.settings.useArucoMarkers)
        setMargin(config.settings.margin || 5)
        setColorChart(config.colorChart)
        alert(`Successfully imported test print: ${config.name}`)
      },
      (error: string) => {
        alert(error)
      }
    )
  }

  const handleGenerateSVG = () => {
    generateSVG(cardLayout, colorChart, useArucoMarkers)
  }

  const handleGeneratePDF = () => {
    generatePDF(cardLayout, colorChart, useArucoMarkers)
  }

  return (
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
          onClick={onAddToChart}
          disabled={colorChart.length >= (useArucoMarkers ? 73 : 77)}
        >
          Add to Chart ({colorChart.length}/{useArucoMarkers ? 73 : 77})
        </Button>
      </div>

      <div className="flex gap-8">
        <ColorSwatchChart
          colorChart={colorChart}
          useArucoMarkers={useArucoMarkers}
          cardLayout={cardLayout}
          hoveredSwatch={hoveredSwatch}
          onSwatchHover={onSwatchHover}
          onReplaceSwatch={onReplaceSwatch}
          onRemoveSwatch={onRemoveSwatch}
        />

        <CardPreview
          cardLayout={cardLayout}
          colorChart={colorChart}
          useArucoMarkers={useArucoMarkers}
          margin={margin}
          onMarginChange={onMarginChange}
          onArucoToggle={onArucoToggle}
        />
      </div>
      
      <div className="flex gap-4 flex-wrap">
        <Button onClick={handleGenerateSVG}>Download SVG</Button>
        <Button onClick={handleGeneratePDF}>Download PDF</Button>
        <Button onClick={handleExportTestPrint}>Export Test Config</Button>
        <div className="relative">
          <input
            type="file"
            accept=".json"
            onChange={(e) => e.target.files?.[0] && handleImportTestPrint(e.target.files[0])}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Button variant="secondary">Import Test Config</Button>
        </div>
      </div>
    </div>
  )
}