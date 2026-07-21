import { useEffect } from 'react'
import { useDigitalTwinStore } from '@/store/useDigitalTwinStore'

export function useKeyboardShortcuts() {
  const experienceMode = useDigitalTwinStore((state) => state.experienceMode)
  const setExperienceMode = useDigitalTwinStore((state) => state.setExperienceMode)
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
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)

      const key = event.key.toLowerCase()
      if (key === 'h' && !isTyping) {
        setExperienceMode(experienceMode === 'campus' ? 'exhibition' : 'campus')
        return
      }

      if (experienceMode === 'exhibition' || isTyping) return

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
    experienceMode,
    extensionPanelOpen,
    requestCameraReset,
    setExperienceMode,
    setExtensionPanelOpen,
    toggleExtensionPanel,
    toggleLabels,
    toggleRenderMode,
  ])
}
