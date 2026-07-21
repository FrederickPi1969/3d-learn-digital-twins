import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  HueSaturation,
  Noise,
  Vignette,
} from '@react-three/postprocessing'
import { useDigitalTwinStore } from '@/store/useDigitalTwinStore'
import { getNightFactor } from '@/utils/environment'

export function SceneEffects() {
  const effectsEnabled = useDigitalTwinStore((state) => state.effectsEnabled)
  const dayPhase = useDigitalTwinStore((state) => state.dayPhase)
  const weatherKind = useDigitalTwinStore((state) => state.weatherKind)
  const weatherIntensity = useDigitalTwinStore((state) => state.weatherIntensity)
  if (!effectsEnabled) return null

  const night = getNightFactor(dayPhase)
  const sand = weatherKind === 'sandstorm' ? weatherIntensity : 0
  const rain = weatherKind === 'rain' ? weatherIntensity : 0

  return (
    <EffectComposer multisampling={4}>
      <Bloom
        mipmapBlur
        intensity={0.76 + night * 0.98 + rain * 0.18}
        luminanceThreshold={0.72 - night * 0.16}
        luminanceSmoothing={0.24 + night * 0.1}
      />
      <BrightnessContrast
        brightness={-0.01 - sand * 0.055}
        contrast={0.04 + night * 0.08 - sand * 0.02}
      />
      <HueSaturation saturation={0.06 + night * 0.08 - sand * 0.34} hue={sand * 0.018} />
      <Noise opacity={0.014 + rain * 0.014 + sand * 0.025} />
      <Vignette eskil={false} offset={0.1} darkness={0.58 + night * 0.16} />
    </EffectComposer>
  )
}
