import { useMemo } from 'react'
import { EXHIBITION_HALL, exhibitionExhibits, exhibitionZones } from '@/data/exhibition'
import { useExhibitionStore } from '@/store/useExhibitionStore'
import type { ExhibitionZone } from '@/types/exhibition'

interface ExhibitionFloorPlanProps {
  compact?: boolean
  interactive?: boolean
  showLegend?: boolean
  className?: string
}

const MAP_WIDTH = 1000
const MAP_HEIGHT = 700
const PADDING_X = 72
const PADDING_Y = 68

function projectPosition(x: number, z: number) {
  const usableWidth = MAP_WIDTH - PADDING_X * 2
  const usableHeight = MAP_HEIGHT - PADDING_Y * 2
  return {
    x: PADDING_X + ((x + EXHIBITION_HALL.width / 2) / EXHIBITION_HALL.width) * usableWidth,
    y: PADDING_Y + ((z + EXHIBITION_HALL.depth / 2) / EXHIBITION_HALL.depth) * usableHeight,
  }
}

const zonePolygons: Record<ExhibitionZone, string> = {
  A: '74,70 926,70 926,210 74,210',
  B: '74,490 926,490 926,630 74,630',
  C: '74,210 250,210 250,490 74,490 750,210 926,210 926,490 750,490',
  D: '250,210 750,210 750,490 250,490',
}

export function ExhibitionFloorPlan({
  compact = false,
  interactive = true,
  showLegend = true,
  className = '',
}: ExhibitionFloorPlanProps) {
  const selectedExhibitId = useExhibitionStore((state) => state.selectedExhibitId)
  const hoveredExhibitId = useExhibitionStore((state) => state.hoveredExhibitId)
  const activeZone = useExhibitionStore((state) => state.activeZone)
  const selectExhibit = useExhibitionStore((state) => state.selectExhibit)
  const setHoveredExhibit = useExhibitionStore((state) => state.setHoveredExhibit)
  const setActiveZone = useExhibitionStore((state) => state.setActiveZone)

  const projected = useMemo(
    () =>
      exhibitionExhibits.map((exhibit) => ({
        exhibit,
        point: projectPosition(exhibit.position[0], exhibit.position[2]),
      })),
    [],
  )

  return (
    <div className={`exhibition-floor-plan ${compact ? 'is-compact' : ''} ${className}`.trim()}>
      <div className="exhibition-floor-plan__stage">
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          role="img"
          aria-label="未来艺术馆展厅平面图，共 48 个展位"
        >
          <defs>
            <linearGradient id="floor-grid" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#07172a" />
              <stop offset="100%" stopColor="#020811" />
            </linearGradient>
            <filter id="map-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="7" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <pattern id="micro-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(75,196,255,0.10)" strokeWidth="1" />
            </pattern>
          </defs>

          <rect x="48" y="45" width="904" height="610" rx="34" fill="url(#floor-grid)" stroke="rgba(78,214,255,0.44)" strokeWidth="2" />
          <rect x="48" y="45" width="904" height="610" rx="34" fill="url(#micro-grid)" />

          {exhibitionZones.map((zone) => {
            const isActive = activeZone === 'ALL' || activeZone === zone.id
            return (
              <g
                key={zone.id}
                className={`floor-zone ${isActive ? 'is-active' : 'is-muted'}`}
                onClick={() => interactive && setActiveZone(activeZone === zone.id ? 'ALL' : zone.id)}
              >
                <polygon
                  points={zonePolygons[zone.id]}
                  fill={zone.accent}
                  fillOpacity={isActive ? 0.055 : 0.012}
                  stroke={zone.accent}
                  strokeOpacity={isActive ? 0.3 : 0.08}
                  strokeWidth="2"
                />
                <text
                  x={zone.id === 'C' ? 112 : zone.id === 'D' ? 290 : 86}
                  y={zone.id === 'A' ? 104 : zone.id === 'B' ? 612 : zone.id === 'C' ? 350 : 250}
                  fill={zone.accent}
                  fillOpacity={isActive ? 0.9 : 0.28}
                  fontSize="24"
                  fontWeight="700"
                  letterSpacing="2"
                >
                  {zone.id} / {zone.shortName}
                </text>
              </g>
            )
          })}

          <path d="M500 642 L470 612 L530 612 Z" fill="#42dfff" filter="url(#map-glow)" />
          <text x="500" y="679" textAnchor="middle" fill="#8ccfe5" fontSize="18" letterSpacing="4">MAIN ENTRANCE</text>

          <rect x="376" y="68" width="248" height="58" rx="10" fill="rgba(13,68,106,0.64)" stroke="#54e6ff" strokeOpacity="0.72" />
          <text x="500" y="92" textAnchor="middle" fill="#baf7ff" fontSize="18" letterSpacing="3">SMART FLOOR MAP</text>
          <text x="500" y="114" textAnchor="middle" fill="#4bdfff" fontSize="12" letterSpacing="2">4K NAVIGATION WALL</text>

          <g transform="translate(500 548)">
            <circle r="34" fill="rgba(10,42,67,0.92)" stroke="#49e4ff" strokeOpacity="0.82" />
            <circle r="17" fill="rgba(56,214,255,0.18)" stroke="#91f5ff" />
            <path d="M0 -11 L8 10 L0 6 L-8 10 Z" fill="#8ef4ff" />
            <text y="53" textAnchor="middle" fill="#78c7dc" fontSize="13">互动终端</text>
          </g>

          {projected.map(({ exhibit, point }) => {
            const selected = selectedExhibitId === exhibit.id
            const hovered = hoveredExhibitId === exhibit.id
            const filteredOut = activeZone !== 'ALL' && activeZone !== exhibit.zone
            const boothWidth = exhibit.zone === 'C' ? 36 : 42
            const boothHeight = exhibit.zone === 'C' ? 42 : 30
            return (
              <g
                key={exhibit.id}
                className={`floor-booth ${selected ? 'is-selected' : ''} ${hovered ? 'is-hovered' : ''}`}
                opacity={filteredOut ? 0.16 : 1}
                transform={`translate(${point.x} ${point.y})`}
                onPointerEnter={() => interactive && setHoveredExhibit(exhibit.id)}
                onPointerLeave={() => interactive && setHoveredExhibit(null)}
                onClick={(event) => {
                  event.stopPropagation()
                  if (interactive) selectExhibit(exhibit.id, true)
                }}
              >
                <rect
                  x={-boothWidth / 2}
                  y={-boothHeight / 2}
                  width={boothWidth}
                  height={boothHeight}
                  rx="6"
                  fill={selected ? exhibit.accent : 'rgba(8,34,54,0.94)'}
                  fillOpacity={selected ? 0.36 : 0.92}
                  stroke={exhibit.accent}
                  strokeWidth={selected ? 4 : hovered ? 3 : 1.5}
                  strokeOpacity={selected || hovered ? 1 : 0.56}
                  filter={selected ? 'url(#map-glow)' : undefined}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={selected ? '#ffffff' : exhibit.accent}
                  fontSize="15"
                  fontWeight="700"
                >
                  {String(exhibit.boothNumber).padStart(2, '0')}
                </text>
              </g>
            )
          })}

          <g transform="translate(86 635)">
            <circle r="7" fill="#48f0be" />
            <text x="16" y="5" fill="#78aebf" fontSize="14">当前位置</text>
          </g>
          <g transform="translate(810 635)">
            <rect x="-8" y="-8" width="16" height="16" rx="3" fill="#ffc96b" />
            <text x="16" y="5" fill="#78aebf" fontSize="14">公共服务</text>
          </g>
        </svg>
      </div>

      {showLegend && (
        <div className="exhibition-floor-plan__legend">
          {exhibitionZones.map((zone) => (
            <button
              type="button"
              key={zone.id}
              className={activeZone === zone.id ? 'is-active' : ''}
              onClick={() => interactive && setActiveZone(activeZone === zone.id ? 'ALL' : zone.id)}
            >
              <i style={{ background: zone.accent }} />
              <span>{zone.id} 区</span>
              <small>{zone.shortName}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
