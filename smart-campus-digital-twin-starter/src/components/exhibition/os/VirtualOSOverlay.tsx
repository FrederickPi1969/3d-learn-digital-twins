import { useEffect, useMemo, useRef, useState } from 'react'
import type { ComponentType } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  CalendarDays,
  ChevronRight,
  CircleUserRound,
  GalleryHorizontal,
  Globe2,
  LayoutGrid,
  Map,
  MonitorCog,
  Power,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Volume2,
  Wifi,
  X,
} from 'lucide-react'
import { exhibitionExhibits } from '@/data/exhibition'
import { useLiveClock } from '@/hooks/useLiveClock'
import { useExhibitionStore } from '@/store/useExhibitionStore'
import type { ExhibitionAppId } from '@/types/exhibition'
import { OSWindow, type OSWindowState } from './OSWindow'
import { BrowserApp } from './apps/BrowserApp'
import { DevicesApp } from './apps/DevicesApp'
import { FloorPlanApp } from './apps/FloorPlanApp'
import { GalleryApp } from './apps/GalleryApp'
import { ScheduleApp } from './apps/ScheduleApp'
import { SettingsApp } from './apps/SettingsApp'

interface AppDefinition {
  id: ExhibitionAppId
  title: string
  shortTitle: string
  description: string
  icon: ComponentType<{ size?: number; strokeWidth?: number }>
  width: number
  height: number
}

const APP_DEFINITIONS: readonly AppDefinition[] = [
  { id: 'browser', title: 'Exhibition Browser', shortTitle: '浏览器', description: '打开本地或允许嵌入的网页', icon: Globe2, width: 960, height: 650 },
  { id: 'floor-plan', title: 'Exhibition Floor Map', shortTitle: '展厅导航', description: '48 个展位实时平面图', icon: Map, width: 1040, height: 690 },
  { id: 'gallery', title: 'Digital Collection', shortTitle: '数字展册', description: '浏览展品档案与策展信息', icon: GalleryHorizontal, width: 1030, height: 680 },
  { id: 'devices', title: 'Facility Operations', shortTitle: '设备控制', description: '联动三维灯光与设备状态', icon: MonitorCog, width: 970, height: 650 },
  { id: 'schedule', title: 'Public Program', shortTitle: '活动日程', description: '查看讲解、演示与预约活动', icon: CalendarDays, width: 850, height: 610 },
  { id: 'settings', title: 'System Settings', shortTitle: '系统设置', description: '界面、场景与隐私偏好', icon: Settings, width: 830, height: 610 },
] as const

const getDefinition = (appId: ExhibitionAppId) =>
  APP_DEFINITIONS.find((definition) => definition.id === appId) ?? APP_DEFINITIONS[0]

function renderApplication(appId: ExhibitionAppId) {
  if (appId === 'browser') return <BrowserApp />
  if (appId === 'floor-plan') return <FloorPlanApp />
  if (appId === 'gallery') return <GalleryApp />
  if (appId === 'devices') return <DevicesApp />
  if (appId === 'schedule') return <ScheduleApp />
  return <SettingsApp />
}

function createWindowState(appId: ExhibitionAppId, offset: number, zIndex: number): OSWindowState {
  const definition = getDefinition(appId)
  return {
    appId,
    title: definition.title,
    icon: <definition.icon size={15} />,
    x: 70 + offset * 34,
    y: 52 + offset * 30,
    width: definition.width,
    height: definition.height,
    zIndex,
    minimized: false,
    maximized: false,
  }
}

function VirtualDesktop({ initialApp }: { initialApp: ExhibitionAppId | null }) {
  const closeOs = useExhibitionStore((state) => state.closeOs)
  const selectExhibit = useExhibitionStore((state) => state.selectExhibit)
  const clock = useLiveClock()
  const [booting, setBooting] = useState(true)
  const [startOpen, setStartOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [windows, setWindows] = useState<OSWindowState[]>([])
  const zCounter = useRef(20)

  const featuredExhibits = useMemo(() => exhibitionExhibits.slice(0, 4), [])

  const focusWindow = (appId: ExhibitionAppId) => {
    zCounter.current += 1
    setWindows((current) =>
      current.map((windowState) =>
        windowState.appId === appId
          ? { ...windowState, zIndex: zCounter.current, minimized: false }
          : windowState,
      ),
    )
  }

  const openApp = (appId: ExhibitionAppId) => {
    setStartOpen(false)
    setWindows((current) => {
      const existing = current.find((windowState) => windowState.appId === appId)
      if (existing) {
        zCounter.current += 1
        return current.map((windowState) =>
          windowState.appId === appId
            ? { ...windowState, minimized: false, zIndex: zCounter.current }
            : windowState,
        )
      }
      zCounter.current += 1
      return [...current, createWindowState(appId, current.length % 6, zCounter.current)]
    })
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setBooting(false), 900)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!initialApp) return
    const timer = window.setTimeout(() => openApp(initialApp), 980)
    return () => window.clearTimeout(timer)
  }, [initialApp])

  return (
    <div
      className="virtual-os"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setStartOpen(false)
          setNotificationOpen(false)
        }
      }}
    >
      <div className="virtual-os__wallpaper" aria-hidden="true">
        <span className="virtual-os__aurora virtual-os__aurora--one" />
        <span className="virtual-os__aurora virtual-os__aurora--two" />
        <span className="virtual-os__window-mark"><i /><i /><i /><i /></span>
        <span className="virtual-os__grid" />
      </div>

      <div className="virtual-os__desktop-icons">
        {APP_DEFINITIONS.map((app) => {
          const Icon = app.icon
          return (
            <button type="button" key={app.id} onDoubleClick={() => openApp(app.id)} onClick={() => setStartOpen(false)}>
              <span><Icon size={28} /></span>
              <strong>{app.shortTitle}</strong>
            </button>
          )
        })}
      </div>

      <div className="virtual-os__info-widget">
        <span><Sparkles size={15} /> SMART EXHIBITION OS</span>
        <strong>未来艺术馆访客终端</strong>
        <p>双击桌面图标启动应用，或使用底部任务栏。展厅导航与设备控制会实时联动三维场景。</p>
        <div><i /> Localhost secure session</div>
      </div>

      <div className="virtual-os__featured-widget">
        <header><span>精选展品</span><button type="button" onClick={() => openApp('gallery')}>查看全部 <ChevronRight size={14} /></button></header>
        <div>
          {featuredExhibits.map((exhibit) => (
            <button
              type="button"
              key={exhibit.id}
              style={{ '--featured-accent': exhibit.accent } as React.CSSProperties}
              onClick={() => {
                selectExhibit(exhibit.id, false)
                openApp('gallery')
              }}
            >
              <i /><strong>{exhibit.title}</strong><span>{exhibit.zone}-{String(exhibit.boothNumber).padStart(2, '0')}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="virtual-os__workarea">
        {windows.map((windowState) => (
          <OSWindow
            key={windowState.appId}
            windowState={windowState}
            onFocus={() => focusWindow(windowState.appId)}
            onClose={() => setWindows((current) => current.filter((item) => item.appId !== windowState.appId))}
            onMinimize={() => setWindows((current) => current.map((item) => item.appId === windowState.appId ? { ...item, minimized: true } : item))}
            onToggleMaximize={() => setWindows((current) => current.map((item) => item.appId === windowState.appId ? { ...item, maximized: !item.maximized, minimized: false } : item))}
            onMove={(x, y) => setWindows((current) => current.map((item) => item.appId === windowState.appId ? { ...item, x, y } : item))}
            onResize={(width, height, x, y) => setWindows((current) => current.map((item) => item.appId === windowState.appId ? { ...item, width, height, x, y } : item))}
          >
            {renderApplication(windowState.appId)}
          </OSWindow>
        ))}
      </div>

      <AnimatePresence>
        {startOpen && (
          <motion.section
            className="virtual-os__start-menu"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.16 }}
          >
            <label><Search size={16} /><input placeholder="搜索应用、设置和展品" autoFocus /></label>
            <header><strong>已固定</strong><button type="button">所有应用 <ChevronRight size={14} /></button></header>
            <div className="virtual-os__start-apps">
              {APP_DEFINITIONS.map((app) => {
                const Icon = app.icon
                return <button type="button" key={app.id} onClick={() => openApp(app.id)}><span><Icon size={22} /></span><strong>{app.shortTitle}</strong></button>
              })}
            </div>
            <header><strong>推荐项目</strong><button type="button" onClick={() => openApp('gallery')}>更多 <ChevronRight size={14} /></button></header>
            <div className="virtual-os__recommendations">
              <button type="button" onClick={() => openApp('floor-plan')}><Map size={20} /><div><strong>展厅实时平面图</strong><span>刚刚更新 · 48 个展位</span></div></button>
              <button type="button" onClick={() => openApp('devices')}><ShieldCheck size={20} /><div><strong>设备健康报告</strong><span>98% 节点在线</span></div></button>
              <button type="button" onClick={() => openApp('schedule')}><CalendarDays size={20} /><div><strong>今日公共活动</strong><span>5 场活动 · 1 场进行中</span></div></button>
            </div>
            <footer><button type="button"><CircleUserRound size={20} /><span>Visitor 01</span></button><button type="button" onClick={closeOs}><Power size={19} /></button></footer>
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notificationOpen && (
          <motion.aside
            className="virtual-os__notifications"
            initial={{ opacity: 0, x: 22 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 18 }}
          >
            <header><strong>通知中心</strong><button type="button" onClick={() => setNotificationOpen(false)}><X size={16} /></button></header>
            <article><MonitorCog size={18} /><div><strong>D 区雾幕控制器需要校准</strong><span>设备控制 · 2 分钟前</span></div></article>
            <article><CalendarDays size={18} /><div><strong>数字艺术策展人导览正在进行</strong><span>A 区 · 10:30</span></div></article>
            <article><ShieldCheck size={18} /><div><strong>系统自检完成</strong><span>所有核心服务正常</span></div></article>
          </motion.aside>
        )}
      </AnimatePresence>

      <footer className="virtual-os__taskbar">
        <div className="virtual-os__taskbar-center">
          <button type="button" className={startOpen ? 'is-active' : ''} onClick={() => setStartOpen((value) => !value)} aria-label="开始菜单"><LayoutGrid size={21} /></button>
          <button type="button" onClick={() => setStartOpen(true)} aria-label="搜索"><Search size={19} /></button>
          {APP_DEFINITIONS.slice(0, 4).map((app) => {
            const Icon = app.icon
            const currentWindow = windows.find((windowState) => windowState.appId === app.id)
            return (
              <button
                type="button"
                key={app.id}
                className={currentWindow ? 'is-running' : ''}
                onClick={() => {
                  if (!currentWindow) openApp(app.id)
                  else if (!currentWindow.minimized && currentWindow.zIndex === Math.max(...windows.map((item) => item.zIndex))) {
                    setWindows((current) => current.map((item) => item.appId === app.id ? { ...item, minimized: true } : item))
                  } else focusWindow(app.id)
                }}
                aria-label={app.shortTitle}
              >
                <Icon size={20} />
              </button>
            )
          })}
          <button type="button" onClick={() => openApp('settings')} aria-label="系统设置"><Settings size={20} /></button>
        </div>
        <button type="button" className="virtual-os__taskbar-widgets" onClick={() => setNotificationOpen((value) => !value)}>
          <Wifi size={14} /><Volume2 size={14} />
          <span><b>{clock.time}</b><small>{clock.date}</small></span>
        </button>
      </footer>

      <button type="button" className="virtual-os__close-session" onClick={closeOs}><X size={18} /><span>退出交互终端</span></button>

      <AnimatePresence>
        {booting && (
          <motion.div className="virtual-os__boot" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.36 }}>
            <div className="virtual-os__boot-logo"><span /><span /><span /><span /></div>
            <strong>Smart Exhibition</strong>
            <div className="virtual-os__boot-spinner"><i /><i /><i /><i /><i /></div>
            <small>正在初始化本地访客会话</small>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function VirtualOSOverlay() {
  const osOpen = useExhibitionStore((state) => state.osOpen)
  const initialApp = useExhibitionStore((state) => state.osInitialApp)
  const sessionNonce = useExhibitionStore((state) => state.osSessionNonce)

  return (
    <AnimatePresence>
      {osOpen && (
        <motion.div
          className="virtual-os-overlay"
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.992 }}
          transition={{ duration: 0.22 }}
        >
          <VirtualDesktop key={sessionNonce} initialApp={initialApp} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
