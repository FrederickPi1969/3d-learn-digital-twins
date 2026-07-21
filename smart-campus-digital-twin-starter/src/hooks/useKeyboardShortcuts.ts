import { useEffect } from 'react'
import { useDigitalTwinStore } from '@/store/useDigitalTwinStore'

export function useKeyboardShortcuts() {
  const exitBuilding = useDigitalTwinStore((state) => state.exitBuilding)
  const requestCameraReset = useDigitalTwinStore((state) => state.requestCameraReset)
  const toggleLabels = useDigitalTwinStore((state) => state.toggleLabels)
  const cycleWeather = useDigitalTwinStore((state) => state.cycleWeather)
  const cycleDayPhase = useDigitalTwinStore((state) => state.cycleDayPhase)
  const toggleRenderMode = useDigitalTwinStore((state) => state.toggleRenderMode)
  const toggleExtensionPanel = useDigitalTwinStore((state) => state.toggleExtensionPanel)
  const extensionPanelOpen = useDigitalTwinStore((state) => state.extensionPanelOpen)
  const setExtensionPanelOpen = useDigitalTwinStore((state) => state.setExtensionPanelOpen)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return

      const key = event.key.toLowerCase()
      if (event.key === 'Escape') {
        if (extensionPanelOpen) setExtensionPanelOpen(false)
        else exitBuilding()
      }
      if (key === 'r') requestCameraReset()
      if (key === 'l') toggleLabels()
      if (key === 'w') cycleWeather()
      if (key === 'n') cycleDayPhase()
      if (key === 'g') toggleRenderMode()
      if (key === 'e') toggleExtensionPanel()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    cycleDayPhase,
    cycleWeather,
    exitBuilding,
    extensionPanelOpen,
    requestCameraReset,
    setExtensionPanelOpen,
    toggleExtensionPanel,
    toggleLabels,
    toggleRenderMode,
  ])
}
