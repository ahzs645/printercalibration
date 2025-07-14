import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { SwatchGenerator } from "./components/SwatchGenerator"
import { ColorComparison } from "./components/ColorComparison"
import { ProfileManager } from "./components/ProfileManager"
import { useCardLayout } from "./hooks/useCardLayout"
import { useColorChart } from "./hooks/useColorChart"
import { useProfiles } from "./hooks/useProfiles"
import { useImageAnalysis } from "./hooks/useImageAnalysis"
import { useLocalStorage } from "./hooks/useLocalStorage"
import { exportProfiles, importProfiles } from "./lib/exportUtils"

function App() {
  // Custom hooks for state management
  const { useArucoMarkers, setUseArucoMarkers, margin, setMargin, cardLayout } = useCardLayout()
  const {
    selectedColor,
    setSelectedColor,
    colorChart,
    setColorChart,
    hoveredSwatch,
    setHoveredSwatch,
    handleAddToChart,
    handleRemoveSwatch,
    handleReplaceSwatch,
    getRGBValues
  } = useColorChart(useArucoMarkers)
  const {
    profiles,
    setProfiles,
    adjustments,
    setAdjustments,
    newProfileName,
    setNewProfileName,
    newProfileDevice,
    setNewProfileDevice,
    handleSaveProfile,
    handleResetAdjustments,
    handleLoadProfile,
    handleDeleteProfile,
    applyAdjustments
  } = useProfiles()
  const {
    scannedImage,
    colorComparisons,
    isAnalyzing,
    analysisResult,
    canvasRef,
    handleImageUpload
  } = useImageAnalysis()

  // Handle localStorage
  useLocalStorage(
    useArucoMarkers,
    margin,
    colorChart,
    setUseArucoMarkers,
    setMargin,
    setColorChart
  )

  // Profile import/export handlers
  const handleExportProfiles = () => {
    exportProfiles(profiles)
  }

  const handleImportProfiles = (file: File) => {
    importProfiles(
      file,
      (importedProfiles) => {
        setProfiles(prev => [...prev, ...importedProfiles])
        alert(`Successfully imported ${importedProfiles.length} profiles`)
      },
      (error) => {
        alert(error)
      }
    )
  }

  const handleImageUploadWrapper = (file: File) => {
    handleImageUpload(file, colorChart, cardLayout)
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
              <SwatchGenerator
                selectedColor={selectedColor}
                setSelectedColor={setSelectedColor}
                colorChart={colorChart}
                useArucoMarkers={useArucoMarkers}
                margin={margin}
                cardLayout={cardLayout}
                hoveredSwatch={hoveredSwatch}
                onSwatchHover={setHoveredSwatch}
                onAddToChart={handleAddToChart}
                onReplaceSwatch={handleReplaceSwatch}
                onRemoveSwatch={handleRemoveSwatch}
                onMarginChange={setMargin}
                onArucoToggle={setUseArucoMarkers}
                getRGBValues={getRGBValues}
                setUseArucoMarkers={setUseArucoMarkers}
                setMargin={setMargin}
                setColorChart={setColorChart}
              />
            </TabsContent>
            
            <TabsContent value="color-comparison" className="mt-6">
              <ColorComparison
                colorChart={colorChart}
                cardLayout={cardLayout}
                scannedImage={scannedImage}
                isAnalyzing={isAnalyzing}
                colorComparisons={colorComparisons}
                analysisResult={analysisResult}
                onImageUpload={handleImageUploadWrapper}
                canvasRef={canvasRef}
                useArucoMarkers={useArucoMarkers}
                margin={margin}
              />
            </TabsContent>
            
            <TabsContent value="profile-manager" className="mt-6">
              <ProfileManager
                selectedColor={selectedColor}
                adjustments={adjustments}
                setAdjustments={setAdjustments}
                applyAdjustments={applyAdjustments}
                profiles={profiles}
                newProfileName={newProfileName}
                setNewProfileName={setNewProfileName}
                newProfileDevice={newProfileDevice}
                setNewProfileDevice={setNewProfileDevice}
                onSaveProfile={handleSaveProfile}
                onResetAdjustments={handleResetAdjustments}
                onLoadProfile={handleLoadProfile}
                onDeleteProfile={handleDeleteProfile}
                onExportProfiles={handleExportProfiles}
                onImportProfiles={handleImportProfiles}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default App
