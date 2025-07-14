import { useState, useEffect } from 'react'
import type { ColorProfile } from '../lib/exportUtils'

export function useProfiles() {
  const [profiles, setProfiles] = useState<ColorProfile[]>(() => {
    const saved = localStorage.getItem('color-profiles')
    return saved ? JSON.parse(saved) : []
  })
  const [adjustments, setAdjustments] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    red: 0,
    green: 0,
    blue: 0
  })
  const [newProfileName, setNewProfileName] = useState("")
  const [newProfileDevice, setNewProfileDevice] = useState("")

  // Save profiles to localStorage
  useEffect(() => {
    localStorage.setItem('color-profiles', JSON.stringify(profiles))
  }, [profiles])

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

  return {
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
  }
}