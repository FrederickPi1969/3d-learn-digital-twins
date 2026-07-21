import { useState } from 'react'
import { Html, RoundedBox, useCursor } from '@react-three/drei'
import { AppWindow, GalleryHorizontal, Map, MonitorCog, PanelsTopLeft } from 'lucide-react'
import { useExhibitionStore } from '@/store/useExhibitionStore'
import { ExhibitionFloorPlan } from '@/components/exhibition/ui/ExhibitionFloorPlan'

function FloorMapWall() {
  const setFloorPlanOpen = useExhibitionStore((state) => state.setFloorPlanOpen)
  const requestCamera = useExhibitionStore((state) => state.requestCamera)

  return (
    <group position={[0, 0, 0]}>
      <RoundedBox args={[19.6, 6.15, 0.42]} radius={0.36} smoothness={8} position={[0, 4.45, -17.45]} castShadow>
        <meshStandardMaterial color="#0a1422" metalness={0.78} roughness={0.2} emissive="#063152" emissiveIntensity={0.45} />
      </RoundedBox>
      <RoundedBox args={[18.9, 5.48, 0.12]} radius={0.24} smoothness={8} position={[0, 4.45, -17.2]}>
        <meshBasicMaterial color="#35dfff" toneMapped={false} />
      </RoundedBox>
      <mesh position={[0, 4.45, -17.13]}>
        <planeGeometry args={[18.5, 5.12]} />
        <meshBasicMaterial color="#03101e" toneMapped={false} />
      </mesh>

      <Html
        transform
        position={[0, 4.45, -17.05]}
        scale={0.01725}
        zIndexRange={[4, 1]}
        style={{ width: 1000, height: 570, pointerEvents: 'auto' }}
      >
        <section className="in-scene-map-screen" aria-label="展厅墙面数字导航大屏">
          <header>
            <div>
              <span>SMART EXHIBITION DIGITAL TWIN</span>
              <strong>展区平面导航</strong>
            </div>
            <div className="in-scene-map-screen__metrics">
              <span><b>48</b> 展位</span>
              <span><b>4</b> 展区</span>
              <span><b>98%</b> 设备在线</span>
            </div>
          </header>
          <div className="in-scene-map-screen__body">
            <ExhibitionFloorPlan compact interactive showLegend={false} />
            <aside>
              <div><span>今日客流</span><strong>2,156</strong><small>人次</small></div>
              <div><span>实时在馆</span><strong>184</strong><small>人</small></div>
              <div><span>平均停留</span><strong>42</strong><small>分钟</small></div>
              <button type="button" onClick={() => setFloorPlanOpen(true)}>打开全屏导航</button>
            </aside>
          </div>
        </section>
      </Html>

      <mesh
        position={[0, 4.45, -16.96]}
        visible={false}
        onDoubleClick={(event) => {
          event.stopPropagation()
          requestCamera('floor-screen')
          setFloorPlanOpen(true)
        }}
      >
        <planeGeometry args={[18.6, 5.2]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  )
}

function KioskDesktopPreview() {
  const openOs = useExhibitionStore((state) => state.openOs)

  return (
    <button type="button" className="kiosk-desktop-preview" onClick={() => openOs(null)} aria-label="打开访客交互操作系统">
      <div className="kiosk-desktop-preview__wallpaper">
        <span className="kiosk-desktop-preview__orb kiosk-desktop-preview__orb--one" />
        <span className="kiosk-desktop-preview__orb kiosk-desktop-preview__orb--two" />
      </div>
      <div className="kiosk-desktop-preview__icons">
        <span><Map size={20} />展厅导航</span>
        <span><GalleryHorizontal size={20} />数字展册</span>
        <span><AppWindow size={20} />浏览器</span>
        <span><MonitorCog size={20} />设备服务</span>
      </div>
      <div className="kiosk-desktop-preview__window">
        <header><i /><i /><i /><b>SMART GALLERY PORTAL</b></header>
        <div>
          <strong>欢迎进入未来艺术馆</strong>
          <span>点击屏幕启动访客交互系统</span>
          <em>OPEN VIRTUAL DESKTOP</em>
        </div>
      </div>
      <footer>
        <PanelsTopLeft size={18} />
        <i />
        <i />
        <i />
        <span>CN&nbsp;&nbsp; 14:30</span>
      </footer>
    </button>
  )
}

function VisitorKiosk() {
  const [hovered, setHovered] = useState(false)
  const openOs = useExhibitionStore((state) => state.openOs)
  const requestCamera = useExhibitionStore((state) => state.requestCamera)
  useCursor(hovered, 'pointer', 'auto')

  return (
    <group position={[0, 0, 11.9]}>
      <RoundedBox args={[5.55, 0.5, 2.25]} radius={0.28} smoothness={6} position={[0, 1.15, 0]} rotation={[-0.31, 0, 0]} castShadow>
        <meshStandardMaterial color="#0d1725" metalness={0.86} roughness={0.22} emissive="#05355d" emissiveIntensity={0.42} />
      </RoundedBox>
      <RoundedBox args={[4.3, 1.55, 1.5]} radius={0.24} smoothness={6} position={[0, 0.62, -0.17]} castShadow receiveShadow>
        <meshStandardMaterial color="#0a111c" metalness={0.72} roughness={0.28} />
      </RoundedBox>
      <mesh position={[0, 0.05, 0.05]}>
        <boxGeometry args={[4.72, 0.08, 1.96]} />
        <meshBasicMaterial color="#3cddff" toneMapped={false} />
      </mesh>
      <pointLight position={[0, 1.6, 1.1]} color="#4ee4ff" intensity={8} distance={7} decay={2} />

      <Html
        transform
        position={[0, 1.38, 0.34]}
        rotation={[-0.31, 0, 0]}
        scale={0.00532}
        zIndexRange={[8, 3]}
        style={{ width: 920, height: 480, pointerEvents: 'auto' }}
      >
        <KioskDesktopPreview />
      </Html>

      <mesh
        position={[0, 1.38, 0.41]}
        rotation={[-0.31, 0, 0]}
        onPointerEnter={(event) => {
          event.stopPropagation()
          setHovered(true)
        }}
        onPointerLeave={(event) => {
          event.stopPropagation()
          setHovered(false)
        }}
        onClick={(event) => {
          event.stopPropagation()
          requestCamera('kiosk')
          openOs(null)
        }}
      >
        <planeGeometry args={[5.0, 2.48]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

export function ExhibitionScreens() {
  return (
    <>
      <FloorMapWall />
      <VisitorKiosk />
    </>
  )
}
