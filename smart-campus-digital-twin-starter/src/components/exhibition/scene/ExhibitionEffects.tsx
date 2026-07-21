import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  HueSaturation,
  Noise,
  SMAA,
  Vignette,
} from '@react-three/postprocessing'
import { useExhibitionStore } from '@/store/useExhibitionStore'

export function ExhibitionEffects() {
  const bloomIntensity = useExhibitionStore((state) => state.bloomIntensity)

  return (
    <EffectComposer multisampling={0}>
      <SMAA />
      <Bloom
        mipmapBlur
        intensity={bloomIntensity * 0.42}
        luminanceThreshold={1.02}
        luminanceSmoothing={0.16}
      />
      <BrightnessContrast brightness={-0.035} contrast={0.045} />
      <HueSaturation saturation={0.012} hue={-0.003} />
      <Noise opacity={0.0015} />
      <Vignette eskil={false} offset={0.14} darkness={0.05} />
    </EffectComposer>
  )
}
