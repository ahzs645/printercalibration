import { Button } from "./ui/button"
import { Slider } from "./ui/slider"
import type { ColorProfile } from "../lib/exportUtils"

interface ProfileManagerProps {
  selectedColor: string
  adjustments: {
    brightness: number
    contrast: number
    saturation: number
    red: number
    green: number
    blue: number
  }
  setAdjustments: (adjustments: any) => void
  applyAdjustments: (color: string) => string
  profiles: ColorProfile[]
  newProfileName: string
  setNewProfileName: (name: string) => void
  newProfileDevice: string
  setNewProfileDevice: (device: string) => void
  onSaveProfile: () => void
  onResetAdjustments: () => void
  onLoadProfile: (profile: ColorProfile) => void
  onDeleteProfile: (profileId: string) => void
  onExportProfiles: () => void
  onImportProfiles: (file: File) => void
}

export function ProfileManager({
  selectedColor,
  adjustments,
  setAdjustments,
  applyAdjustments,
  profiles,
  newProfileName,
  setNewProfileName,
  newProfileDevice,
  setNewProfileDevice,
  onSaveProfile,
  onResetAdjustments,
  onLoadProfile,
  onDeleteProfile,
  onExportProfiles,
  onImportProfiles
}: ProfileManagerProps) {
  return (
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
          <Button onClick={onSaveProfile}>Save Profile</Button>
          <Button variant="secondary" onClick={onResetAdjustments}>Reset Adjustments</Button>
        </div>
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-medium">Saved Profiles</h3>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onExportProfiles}>
              Export All Profiles
            </Button>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={(e) => e.target.files?.[0] && onImportProfiles(e.target.files[0])}
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
                      <Button variant="secondary" size="sm" onClick={() => onLoadProfile(profile)}>
                        Load
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => onDeleteProfile(profile.id)}>
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
  )
}