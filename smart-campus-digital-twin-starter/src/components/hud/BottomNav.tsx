import { useDigitalTwinStore } from '@/store/useDigitalTwinStore'

const NAV_ITEMS = [
  { id: 'operations', label: '设备运维' },
  { id: 'resources', label: '资源管理' },
  { id: 'campus', label: '园区总览' },
  { id: 'gis', label: '地理信息' },
  { id: 'security', label: '智慧安防' },
] as const

export function BottomNav() {
  const viewMode = useDigitalTwinStore((state) => state.viewMode)
  const renderMode = useDigitalTwinStore((state) => state.renderMode)
  const exitBuilding = useDigitalTwinStore((state) => state.exitBuilding)
  const setRenderMode = useDigitalTwinStore((state) => state.setRenderMode)

  return (
    <nav className="bottom-nav" aria-label="数字孪生功能导航">
      {NAV_ITEMS.map((item) => {
        const active =
          (item.id === 'gis' && renderMode === 'gis') ||
          (item.id === 'campus' && renderMode === 'twin' && viewMode === 'campus') ||
          (item.id === 'operations' && renderMode === 'twin' && viewMode === 'building')
        return (
          <button
            type="button"
            key={item.id}
            className={active ? 'is-active' : ''}
            onClick={() => {
              if (item.id === 'gis') setRenderMode('gis')
              if (item.id === 'campus') {
                setRenderMode('twin')
                exitBuilding()
              }
            }}
          >
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
