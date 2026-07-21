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
        intensity={bloomIntensity}
        luminanceThreshold={0.64}
        luminanceSmoothing={0.22}
      />
      <BrightnessContrast brightness={0.015} contrast={0.08} />
      <HueSaturation saturation={0.09} hue={-0.008} />
      <Noise opacity={0.008} />
      <Vignette eskil={false} offset={0.09} darkness={0.68} />
    </EffectComposer>
  )
}
