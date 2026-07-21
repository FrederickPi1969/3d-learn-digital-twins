import { useState } from 'react'
import { Bell, Eye, Languages, MonitorCog, MousePointer2, ShieldCheck, Volume2 } from 'lucide-react'
import { useExhibitionStore } from '@/store/useExhibitionStore'

export function SettingsApp() {
  const showLabels = useExhibitionStore((state) => state.showLabels)
  const showMiniMap = useExhibitionStore((state) => state.showMiniMap)
  const showArchitecture = useExhibitionStore((state) => state.showArchitecture)
  const toggleLabels = useExhibitionStore((state) => state.toggleLabels)
  const toggleMiniMap = useExhibitionStore((state) => state.toggleMiniMap)
  const toggleArchitecture = useExhibitionStore((state) => state.toggleArchitecture)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [language, setLanguage] = useState('简体中文')

  const rows = [
    { id: 'labels', icon: Eye, title: '三维展签', description: '在展品上方显示编号和名称', enabled: showLabels, toggle: toggleLabels },
    { id: 'map', icon: MousePointer2, title: '悬浮小地图', description: '在桌面外层显示实时展厅位置', enabled: showMiniMap, toggle: toggleMiniMap },
    { id: 'architecture', icon: MonitorCog, title: '建筑外壳', description: '显示墙体、入口框架与顶部格栅', enabled: showArchitecture, toggle: toggleArchitecture },
    { id: 'sound', icon: Volume2, title: '界面提示音', description: '启用本地操作系统交互提示音', enabled: soundEnabled, toggle: () => setSoundEnabled((value) => !value) },
    { id: 'notifications', icon: Bell, title: '运维通知', description: '接收设备告警和活动开始通知', enabled: notificationsEnabled, toggle: () => setNotificationsEnabled((value) => !value) },
  ]

  return (
    <div className="settings-app">
      <aside>
        <div><MonitorCog size={22} /><span>系统设置</span></div>
        <button type="button" className="is-active">个性化</button>
        <button type="button">显示与交互</button>
        <button type="button">通知</button>
        <button type="button">隐私与安全</button>
        <button type="button">关于系统</button>
      </aside>
      <main>
        <header><span>PERSONALIZATION</span><strong>访客系统偏好</strong></header>
        <section className="settings-app__hero">
          <MonitorCog size={28} />
          <div><strong>Smart Exhibition OS</strong><span>本地交互终端 · Build 3.0.0</span></div>
          <em>系统已激活</em>
        </section>
        <section className="settings-app__rows">
          {rows.map((row) => {
            const Icon = row.icon
            return (
              <button type="button" key={row.id} onClick={row.toggle}>
                <Icon size={19} />
                <div><strong>{row.title}</strong><span>{row.description}</span></div>
                <i className={row.enabled ? 'is-on' : ''}><b /></i>
              </button>
            )
          })}
        </section>
        <section className="settings-app__language">
          <Languages size={19} />
          <div><strong>显示语言</strong><span>影响桌面应用与访客导览内容</span></div>
          <select value={language} onChange={(event) => setLanguage(event.target.value)}>
            <option>简体中文</option>
            <option>English</option>
            <option>日本語</option>
          </select>
        </section>
        <footer><ShieldCheck size={16} /> 所有设置仅保存在当前浏览器会话中，不会上传到外部服务器。</footer>
      </main>
    </div>
  )
}
