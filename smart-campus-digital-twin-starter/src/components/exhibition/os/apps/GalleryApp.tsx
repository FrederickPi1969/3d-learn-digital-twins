import { useMemo, useState } from 'react'
import { ArrowUpRight, Grid3X3, Search, SlidersHorizontal } from 'lucide-react'
import { exhibitionExhibits, exhibitionZones, getExhibitById } from '@/data/exhibition'
import { useExhibitionStore } from '@/store/useExhibitionStore'
import type { ExhibitionZone } from '@/types/exhibition'

export function GalleryApp() {
  const [query, setQuery] = useState('')
  const [zone, setZone] = useState<ExhibitionZone | 'ALL'>('ALL')
  const selectedExhibitId = useExhibitionStore((state) => state.selectedExhibitId)
  const selectExhibit = useExhibitionStore((state) => state.selectExhibit)
  const closeOs = useExhibitionStore((state) => state.closeOs)
  const selected = getExhibitById(selectedExhibitId) ?? exhibitionExhibits[0]

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return exhibitionExhibits.filter((exhibit) => {
      const matchesZone = zone === 'ALL' || exhibit.zone === zone
      const matchesQuery =
        !normalized ||
        exhibit.title.toLowerCase().includes(normalized) ||
        exhibit.artist.toLowerCase().includes(normalized) ||
        String(exhibit.boothNumber).includes(normalized)
      return matchesZone && matchesQuery
    })
  }, [query, zone])

  return (
    <div className="gallery-app">
      <header>
        <div><span>DIGITAL COLLECTION</span><strong>馆藏数字展册</strong></div>
        <label><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索展品、艺术家或展位" /></label>
      </header>
      <div className="gallery-app__toolbar">
        <span><SlidersHorizontal size={14} /> 展区</span>
        <button type="button" className={zone === 'ALL' ? 'is-active' : ''} onClick={() => setZone('ALL')}>全部</button>
        {exhibitionZones.map((item) => (
          <button type="button" key={item.id} className={zone === item.id ? 'is-active' : ''} onClick={() => setZone(item.id)}>{item.id} 区</button>
        ))}
        <em><Grid3X3 size={14} /> {results.length} 件</em>
      </div>
      <div className="gallery-app__body">
        <div className="gallery-app__grid">
          {results.map((exhibit) => (
            <button
              type="button"
              key={exhibit.id}
              className={selected?.id === exhibit.id ? 'is-selected' : ''}
              style={{ '--card-accent': exhibit.accent } as React.CSSProperties}
              onClick={() => selectExhibit(exhibit.id, false)}
              onDoubleClick={() => {
                selectExhibit(exhibit.id, true)
                closeOs()
              }}
            >
              <div className="gallery-app__thumbnail">
                {exhibit.imageUrl ? <img src={exhibit.imageUrl} alt="" /> : <span><i /><i /><i /></span>}
                <b>{exhibit.zone}-{String(exhibit.boothNumber).padStart(2, '0')}</b>
              </div>
              <strong>{exhibit.title}</strong>
              <span>{exhibit.artist}</span>
              <small>{exhibit.year} · {exhibit.subtitle}</small>
            </button>
          ))}
        </div>
        {selected && (
          <aside style={{ '--card-accent': selected.accent } as React.CSSProperties}>
            <span>SELECTED ARCHIVE</span>
            <strong>{selected.title}</strong>
            <p>{selected.description}</p>
            <dl>
              <div><dt>艺术家</dt><dd>{selected.artist}</dd></div>
              <div><dt>展位</dt><dd>{selected.zone}-{String(selected.boothNumber).padStart(2, '0')}</dd></div>
              <div><dt>类型</dt><dd>{selected.category}</dd></div>
              <div><dt>年代</dt><dd>{selected.year}</dd></div>
            </dl>
            <button type="button" onClick={() => {
              selectExhibit(selected.id, true)
              closeOs()
            }}>在三维展厅中查看 <ArrowUpRight size={16} /></button>
          </aside>
        )}
      </div>
    </div>
  )
}
