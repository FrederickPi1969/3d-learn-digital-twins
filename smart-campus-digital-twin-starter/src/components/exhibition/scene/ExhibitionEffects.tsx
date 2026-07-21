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
    <EffectComposer multisampling={4}>
      <SMAA />
      <Bloom
        mipmapBlur
        intensity={bloomIntensity * 0.72}
        luminanceThreshold={0.78}
        luminanceSmoothing={0.24}
      />
      <BrightnessContrast brightness={0.028} contrast={0.018} />
      <HueSaturation saturation={0.018} hue={-0.003} />
      <Noise opacity={0.0035} />
      <Vignette eskil={false} offset={0.12} darkness={0.075} />
    </EffectComposer>
  )
}
