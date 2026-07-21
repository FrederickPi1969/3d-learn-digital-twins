import { useState } from 'react'
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  LampCeiling,
  Monitor,
  SlidersHorizontal,
  Thermometer,
  Users,
} from 'lucide-react'
import { exhibitionDevices } from '@/data/exhibition'
import { useExhibitionStore } from '@/store/useExhibitionStore'

const DEVICE_ICONS = {
  lighting: LampCeiling,
  display: Monitor,
  environment: Thermometer,
  security: Camera,
} as const

export function DevicesApp() {
  const galleryLighting = useExhibitionStore((state) => state.galleryLighting)
  const bloomIntensity = useExhibitionStore((state) => state.bloomIntensity)
  const ambientVisitors = useExhibitionStore((state) => state.ambientVisitors)
  const setGalleryLighting = useExhibitionStore((state) => state.setGalleryLighting)
  const setBloomIntensity = useExhibitionStore((state) => state.setBloomIntensity)
  const setAmbientVisitors = useExhibitionStore((state) => state.setAmbientVisitors)
  const [autoMode, setAutoMode] = useState(true)
  const [scenePreset, setScenePreset] = useState<'standard' | 'focus' | 'event'>('standard')

  return (
    <div className="devices-app">
      <header>
        <div><span>FACILITY OPERATIONS</span><strong>展厅设备与场景控制</strong></div>
        <div className="devices-app__health"><CheckCircle2 size={18} /><span>系统健康度</span><strong>98%</strong></div>
      </header>
      <div className="devices-app__layout">
        <main>
          <div className="devices-app__section-title"><span>DEVICE MATRIX</span><strong>在线设备</strong><small>{exhibitionDevices.length} 个示例节点</small></div>
          <div className="devices-app__device-grid">
            {exhibitionDevices.map((device) => {
              const Icon = DEVICE_ICONS[device.kind]
              return (
                <article key={device.id} className={`status-${device.status}`}>
                  <Icon size={19} />
                  <div><span>{device.zone}</span><strong>{device.name}</strong><small>{device.value}</small></div>
                  {device.status === 'warning' ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
                </article>
              )
            })}
          </div>
        </main>
        <aside>
          <div className="devices-app__section-title"><span>LIVE SCENE LINK</span><strong>三维场景联动</strong><small>以下控件会立即影响背景中的 Three.js 场景</small></div>
          <label>
            <div><LampCeiling size={16} /><span>展厅综合照明</span><b>{Math.round(galleryLighting * 100)}%</b></div>
            <input type="range" min="35" max="125" value={Math.round(galleryLighting * 100)} onChange={(event) => setGalleryLighting(Number(event.target.value) / 100)} />
          </label>
          <label>
            <div><SlidersHorizontal size={16} /><span>泛光强度</span><b>{Math.round(bloomIntensity * 100)}%</b></div>
            <input type="range" min="0" max="160" value={Math.round(bloomIntensity * 100)} onChange={(event) => setBloomIntensity(Number(event.target.value) / 100)} />
          </label>
          <label>
            <div><Users size={16} /><span>环境访客数量</span><b>{ambientVisitors}</b></div>
            <input type="range" min="0" max="28" value={ambientVisitors} onChange={(event) => setAmbientVisitors(Number(event.target.value))} />
          </label>

          <div className="devices-app__presets">
            <span>LIGHTING PRESET</span>
            {(['standard', 'focus', 'event'] as const).map((preset) => (
              <button
                type="button"
                key={preset}
                className={scenePreset === preset ? 'is-active' : ''}
                onClick={() => {
                  setScenePreset(preset)
                  if (preset === 'standard') {
                    setGalleryLighting(0.88)
                    setBloomIntensity(0.82)
                  }
                  if (preset === 'focus') {
                    setGalleryLighting(0.62)
                    setBloomIntensity(0.58)
                  }
                  if (preset === 'event') {
                    setGalleryLighting(1.12)
                    setBloomIntensity(1.2)
                  }
                }}
              >
                {preset === 'standard' ? '常规开放' : preset === 'focus' ? '重点展项' : '活动模式'}
              </button>
            ))}
          </div>

          <button type="button" className={`devices-app__auto ${autoMode ? 'is-active' : ''}`} onClick={() => setAutoMode((value) => !value)}>
            <span>自动场景调度</span><i />
          </button>
        </aside>
      </div>
    </div>
  )
}
