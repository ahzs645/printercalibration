import { useEffect } from 'react'

export function useLocalStorage(
  useArucoMarkers: boolean,
  margin: number,
  colorChart: string[],
  setUseArucoMarkers: (value: boolean) => void,
  setMargin: (value: number) => void,
  setColorChart: (value: string[]) => void
) {
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
  }, [setUseArucoMarkers, setMargin, setColorChart])
}