import { Html, RoundedBox, Text } from '@react-three/drei'
import {
  GalleryHorizontal,
  Globe2,
  Map,
  MonitorCog,
  MousePointer2,
  ScanLine,
} from 'lucide-react'
import { ExhibitionFloorPlan } from '@/components/exhibition/ui/ExhibitionFloorPlan'
import { VirtualDesktop } from '@/components/exhibition/os/VirtualOSDesktop'
import { useExhibitionStore } from '@/store/useExhibitionStore'

const WALL_SCREEN_PIXEL_WIDTH = 1366
const WALL_SCREEN_PIXEL_HEIGHT = 768
// Match the Html desktop to the visible 14.67 × 8.18 world-unit screen plane.
// A scalar left unused border on every side and made the OS look detached.
const WALL_SCREEN_WORLD_SCALE: [number, number, number] = [
  14.67 / WALL_SCREEN_PIXEL_WIDTH,
  8.18 / WALL_SCREEN_PIXEL_HEIGHT,
  1,
]

function WallNavigationDashboard() {
  const setFloorPlanOpen = useExhibitionStore((state) => state.setFloorPlanOpen)
  const openOs = useExhibitionStore((state) => state.openOs)

  return (
    <section
      className="in-scene-map-screen in-scene-map-screen--unified"
      aria-label="展厅墙面数字导航与访客系统大屏"
      onDoubleClick={(event) => {
        if ((event.target as HTMLElement).closest('button')) return
        setFloorPlanOpen(true)
      }}
    >
      <header>
        <div>
          <span>SMART EXHIBITION DIGITAL TWIN · WALL TERMINAL 01</span>
          <strong>展区平面导航</strong>
        </div>
        <div className="in-scene-map-screen__metrics">
          <span><b>48</b> 展位</span>
          <span><b>4</b> 展区</span>
          <span><b>98%</b> 设备在线</span>
        </div>
      </header>

      <div className="in-scene-map-screen__body">
        <div className="in-scene-map-screen__map-shell">
          <div className="in-scene-map-screen__map-toolbar">
            <span><ScanLine size={18} /> LIVE FLOOR GRAPH</span>
            <div><i />实时同步 <b>10:42:18</b></div>
          </div>
          <ExhibitionFloorPlan compact interactive showLegend={false} />
          <footer>
            <span><i className="is-cyan" />数字艺术</span>
            <span><i className="is-violet" />当代雕塑</span>
            <span><i className="is-amber" />文物设计</span>
            <span><i className="is-green" />未来实验</span>
          </footer>
        </div>

        <aside>
          <div className="in-scene-map-screen__metric-card">
            <span>今日客流</span><strong>2,156</strong><small>人次 · +12.6%</small>
          </div>
          <div className="in-scene-map-screen__metric-card">
            <span>实时在馆</span><strong>184</strong><small>平均停留 42 分钟</small>
          </div>
          <div className="in-scene-map-screen__metric-card">
            <span>空间环境</span><strong>22.6°C</strong><small>湿度 46% · 优</small>
          </div>
          <button type="button" onClick={() => openOs('floor-plan')}>
            <MonitorCog size={19} /> 启动墙面访客系统
          </button>
          <button type="button" className="is-secondary" onClick={() => setFloorPlanOpen(true)}>
            <Map size={19} /> 打开全屏导航
          </button>
        </aside>
      </div>

      <footer className="in-scene-map-screen__footer">
        <span><MousePointer2 size={17} /> 点击展位同步聚焦三维展品</span>
        <nav>
          <button type="button" onClick={() => openOs('floor-plan')}><Map size={17} />展厅导航</button>
          <button type="button" onClick={() => openOs('gallery')}><GalleryHorizontal size={17} />数字展册</button>
          <button type="button" onClick={() => openOs('browser')}><Globe2 size={17} />浏览器</button>
          <button type="button" onClick={() => openOs('devices')}><MonitorCog size={17} />设备服务</button>
        </nav>
      </footer>
    </section>
  )
}

function UnifiedWallSurface() {
  const osOpen = useExhibitionStore((state) => state.osOpen)
  const initialApp = useExhibitionStore((state) => state.osInitialApp)
  const sessionNonce = useExhibitionStore((state) => state.osSessionNonce)

  return (
    <div className="embedded-wall-screen-surface">
      {osOpen ? (
        <VirtualDesktop key={sessionNonce} initialApp={initialApp} embedded />
      ) : (
        <WallNavigationDashboard />
      )}
    </div>
  )
}

/**
 * A single architectural wall display hosts both the floor-map dashboard and
 * the complete visitor operating system. There is deliberately no detached
 * full-screen overlay or freestanding terminal: the React interface lives on
 * the physical Three.js screen through Drei's transform-mode Html portal.
 */
function UnifiedWallTerminal() {
  return (
    <group position={[0, 0, 0]}>
      <RoundedBox
        args={[16.35, 8.52, 0.76]}
        radius={0.5}
        smoothness={10}
        position={[0, 4.3, -17.47]}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          color="#f7f8f8"
          roughness={0.29}
          metalness={0.08}
          clearcoat={0.58}
          clearcoatRoughness={0.22}
        />
      </RoundedBox>

      <RoundedBox args={[15.56, 8.36, 0.28]} radius={0.33} smoothness={10} position={[0, 4.3, -16.99]}>
        <meshStandardMaterial color="#17222c" metalness={0.72} roughness={0.16} />
      </RoundedBox>
      <RoundedBox args={[14.96, 8.28, 0.1]} radius={0.24} smoothness={10} position={[0, 4.3, -16.8]}>
        <meshBasicMaterial color="#54dcf5" toneMapped={false} />
      </RoundedBox>
      <mesh position={[0, 4.3, -16.72]}>
        <planeGeometry args={[14.67, 8.18]} />
        <meshBasicMaterial color="#020914" toneMapped={false} />
      </mesh>

      <Html
        transform
        position={[0, 4.3, -16.64]}
        scale={WALL_SCREEN_WORLD_SCALE}
        zIndexRange={[20, 3]}
        style={{
          width: WALL_SCREEN_PIXEL_WIDTH,
          height: WALL_SCREEN_PIXEL_HEIGHT,
          pointerEvents: 'auto',
        }}
      >
        <UnifiedWallSurface />
      </Html>

      <Text
        position={[0, 8.39, -16.53]}
        fontSize={0.13}
        letterSpacing={0.12}
        color="#5b6970"
        anchorX="center"
        anchorY="middle"
      >
        INTEGRATED NAVIGATION + VISITOR OS · 嵌入式智慧交互墙
      </Text>
      <mesh position={[0, 0.17, -16.52]}>
        <boxGeometry args={[9.8, 0.045, 0.055]} />
        <meshBasicMaterial color="#5bdef5" toneMapped={false} />
      </mesh>
      <pointLight position={[0, 4.2, -13.8]} color="#82eaff" intensity={4.8} distance={10} decay={2} />
    </group>
  )
}

export function ExhibitionScreens() {
  return <UnifiedWallTerminal />
}
