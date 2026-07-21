import type { CampusTelemetry } from '@/types/digitalTwin'
import { formatCompact } from '@/utils/math'
import { MetricCard } from './MetricCard'
import { PanelFrame } from './PanelFrame'
import { Sparkline } from './Sparkline'

function ResourceIcon({ kind }: { kind: 'water' | 'power' }) {
  return (
    <span className={`resource-icon resource-icon--${kind}`} aria-hidden="true">
      {kind === 'water' ? '◈' : 'ϟ'}
    </span>
  )
}

function TrendRow({
  name,
  value,
  unit,
  values,
  color,
}: {
  name: string
  value: string
  unit: string
  values: readonly number[]
  color: string
}) {
  return (
    <div className="trend-row">
      <div className="trend-row__heading">
        <span>{name}</span>
        <strong>
          {value}<small>{unit}</small>
        </strong>
      </div>
      <Sparkline values={values} color={color} height={44} />
    </div>
  )
}

export function MacroDashboard({ telemetry }: { telemetry: CampusTelemetry }) {
  return (
    <>
      <div className="dashboard-column dashboard-column--left">
        <PanelFrame title="能源管理" eyebrow="ENERGY MANAGEMENT">
          <div className="resource-overview">
            <MetricCard
              label="今日用水量"
              value={formatCompact(telemetry.waterTodayM3, 0)}
              unit="m³"
              icon={<ResourceIcon kind="water" />}
              detail="较昨日 -3.8%"
            />
            <MetricCard
              label="实时用电"
              value={formatCompact(telemetry.powerNowKw, 0)}
              unit="kW"
              icon={<ResourceIcon kind="power" />}
              accent="amber"
              detail="负荷率 78.4%"
            />
          </div>
        </PanelFrame>

        <PanelFrame title="今日趋势" eyebrow="REAL-TIME TELEMETRY">
          <div className="trend-stack">
            <TrendRow
              name="照明设备"
              value="445"
              unit="kWh"
              values={telemetry.waterTrend}
              color="#4ecfff"
            />
            <TrendRow
              name="显示设备"
              value="406"
              unit="kWh"
              values={telemetry.powerTrend}
              color="#ffc64e"
            />
            <TrendRow
              name="空调末端"
              value="375"
              unit="kWh"
              values={telemetry.occupancyTrend}
              color="#45efd0"
            />
            <TrendRow
              name="插座回路"
              value="318"
              unit="kWh"
              values={telemetry.deviceTrend}
              color="#57a9ff"
            />
          </div>
        </PanelFrame>
      </div>

      <div className="dashboard-column dashboard-column--right">
        <PanelFrame title="电梯使用情况" eyebrow="VERTICAL TRANSPORT">
          <div className="status-table">
            <div><span>运行总数</span><strong>180</strong></div>
            <div><span>总数</span><strong>180</strong></div>
            <div><span>上行</span><strong>180</strong></div>
            <div><span>故障</span><strong>0</strong></div>
          </div>
        </PanelFrame>

        <PanelFrame title="设备状态" eyebrow="FACILITY STATUS">
          <div className="device-strip">
            <div><strong>{telemetry.activeDevices}</strong><span>在线设备</span></div>
            <div><strong>30</strong><span>巡检任务</span></div>
            <div><strong>{telemetry.warnings}</strong><span>活动告警</span></div>
          </div>
        </PanelFrame>

        <PanelFrame title="停车场状态" eyebrow="PARKING MANAGEMENT">
          <div className="parking-total">
            <span>可用泊位</span>
            <strong>{String(telemetry.availableParking).padStart(3, '0')}</strong>
            <small>位</small>
          </div>
          <div className="parking-grid">
            <div><span>总车位</span><strong>250</strong></div>
            <div><span>占用车位</span><strong>{250 - telemetry.availableParking}</strong></div>
            <div><span>访客车位</span><strong>36</strong></div>
            <div><span>充电车位</span><strong>55</strong></div>
          </div>
          <div className="radial-meter" style={{ '--meter': '72%' } as React.CSSProperties}>
            <div><strong>72</strong><span>%</span></div>
            <small>周转效率</small>
          </div>
        </PanelFrame>
      </div>
    </>
  )
}
