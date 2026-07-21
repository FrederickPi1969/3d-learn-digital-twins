import { CalendarDays, CheckCircle2, Clock3, MapPin, Radio } from 'lucide-react'
import { exhibitionSchedule } from '@/data/exhibition'

export function ScheduleApp() {
  return (
    <div className="schedule-app">
      <header>
        <div><span>PUBLIC PROGRAM</span><strong>今日活动日程</strong></div>
        <div><CalendarDays size={18} /><span>2026 年 7 月 21 日</span></div>
      </header>
      <div className="schedule-app__summary">
        <div><span>今日活动</span><strong>5</strong><small>场</small></div>
        <div><span>正在进行</span><strong>1</strong><small>场</small></div>
        <div><span>预约访客</span><strong>328</strong><small>人</small></div>
        <div><span>剩余名额</span><strong>76</strong><small>位</small></div>
      </div>
      <main>
        {exhibitionSchedule.map((item, index) => (
          <article key={item.id} className={`status-${item.status}`}>
            <div className="schedule-app__timeline"><span>{item.time}</span><i /><b>{String(index + 1).padStart(2, '0')}</b></div>
            <div className="schedule-app__event">
              <div>
                {item.status === 'live' ? <Radio size={16} /> : item.status === 'completed' ? <CheckCircle2 size={16} /> : <Clock3 size={16} />}
                <span>{item.status === 'live' ? '正在进行' : item.status === 'completed' ? '已完成' : '即将开始'}</span>
              </div>
              <strong>{item.title}</strong>
              <p><MapPin size={14} /> {item.location}</p>
            </div>
            <button type="button" disabled={item.status === 'completed'}>{item.status === 'live' ? '进入直播' : item.status === 'completed' ? '查看回顾' : '预约活动'}</button>
          </article>
        ))}
      </main>
    </div>
  )
}
