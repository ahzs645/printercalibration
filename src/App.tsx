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
    handleImageUpload,
    clearImage
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

  const handleCreateProfileFromComparison = (
    adjustments: Array<{color: string, adjustment: {r: number, g: number, b: number}}>, 
    profileName: string, 
    deviceName: string
  ) => {
    // Convert adjustments to the profile format
    const profileAdjustments: Record<string, {r: number, g: number, b: number}> = {}
    adjustments.forEach(adj => {
      profileAdjustments[adj.color] = adj.adjustment
    })

    const newProfile = {
      id: Date.now().toString(),
      name: profileName,
      device: deviceName,
      adjustments: profileAdjustments,
      createdAt: new Date().toISOString()
    }

    setProfiles(prev => [...prev, newProfile])
    alert(`Profile "${profileName}" created successfully with ${adjustments.length} color adjustments!`)
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold">Color Calibration</h1>
          </div>
        </div>
      </nav>
      
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="swatch-generator" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
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
              onClearImage={clearImage}
              canvasRef={canvasRef}
              useArucoMarkers={useArucoMarkers}
              margin={margin}
              onCreateProfile={handleCreateProfileFromComparison}
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
  )
}

export default App
