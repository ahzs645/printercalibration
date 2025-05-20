import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { Button } from "./components/ui/button"
import { Slider } from "./components/ui/slider"
import { useState } from "react"

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
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
                
                <div className="grid grid-cols-[30px_repeat(10,1fr)] gap-0.5">
                  {/* Standard color swatches will go here */}
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-medium">Custom Colors</h3>
                  <p className="text-muted-foreground">Add specific colors you want to calibrate:</p>
                  
                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <input type="color" className="w-12 h-12 rounded cursor-pointer" />
                    <div className="w-16 h-16 rounded border border-border" />
                    <div className="flex-1 space-y-1">
                      <div className="text-sm">HEX: <span className="font-mono">#4285f4</span></div>
                      <div className="text-sm">RGB: <span className="font-mono">rgb(66, 133, 244)</span></div>
                    </div>
                    <Button>Add to Chart</Button>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <Button>Download SVG</Button>
                  <Button>Download PDF</Button>
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
                  <input type="file" accept="image/*" className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
                  <p className="text-sm text-muted-foreground mt-2">For best results, ensure good lighting and minimal glare</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-medium mb-4">Original Colors</h3>
                    <div className="w-full h-[300px] border border-border rounded-lg" />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium mb-4">Scanned Colors</h3>
                    <div className="w-full h-[300px] border border-border rounded-lg flex items-center justify-center text-muted-foreground">
                      <p>Upload an image to see preview</p>
                    </div>
                  </div>
                </div>
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
                      <div className="w-full h-32 rounded-lg border border-border" style={{ backgroundColor: "#4285f4" }} />
                      <div className="mt-2 text-sm font-mono">HEX: #4285f4</div>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-medium mb-4">Adjusted (Print Preview)</h3>
                      <div className="w-full h-32 rounded-lg border border-border" style={{ backgroundColor: "#4285f4" }} />
                      <div className="mt-2 text-sm font-mono">HEX: #4285f4</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <Button>Save Profile</Button>
                    <Button variant="secondary">Reset Adjustments</Button>
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
                        {/* Will be filled with saved profiles */}
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
