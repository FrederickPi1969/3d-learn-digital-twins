import type {
  ExhibitCategory,
  ExhibitConfig,
  ExhibitDisplayKind,
  ExhibitionDevice,
  ExhibitionScheduleItem,
  ExhibitionZone,
  ExhibitionZoneConfig,
} from '@/types/exhibition'

export const EXHIBITION_HALL = {
  width: 50,
  depth: 36,
  wallHeight: 8.4,
  boothCount: 48,
  entranceZ: 17.2,
  bigScreenPosition: [0, 4.65, -17.48] as const,
  kioskPosition: [0, 0, 11.9] as const,
} as const

export const exhibitionZones: readonly ExhibitionZoneConfig[] = [
  {
    id: 'A',
    name: 'A 区 · 数字艺术长廊',
    shortName: '数字艺术',
    accent: '#39d8ff',
    description: '实时图形、生成式艺术与沉浸式影像。',
  },
  {
    id: 'B',
    name: 'B 区 · 当代雕塑庭院',
    shortName: '当代雕塑',
    accent: '#8f7cff',
    description: '几何雕塑、材质实验与公共艺术原型。',
  },
  {
    id: 'C',
    name: 'C 区 · 文物与设计档案',
    shortName: '文物设计',
    accent: '#f2c879',
    description: '文化遗产数字化、工业设计与工艺档案。',
  },
  {
    id: 'D',
    name: 'D 区 · 未来实验场',
    shortName: '未来实验',
    accent: '#48f0be',
    description: '全息装置、交互原型与空间计算实验。',
  },
] as const

const titles = [
  '潮汐记忆', '星尘索引', '城市脉冲', '无界回声', '量子花园', '光锥档案',
  '蓝色迁徙', '时间折面', '深海信标', '合成月相', '风的拓扑', '静默网络',
  '引力之环', '流体纪念碑', '折叠山脉', '空白引擎', '零点结构', '镜面生长',
  '边界呼吸', '软体几何', '轨道残影', '连续体', '透明重力', '未来化石',
  '青铜回声', '陶土算法', '纹样数据库', '器物之光', '数字经纬', '机械诗学',
  '材料年轮', '城市标本', '工艺云图', '复原现场', '尺度模型', '触觉档案',
  '光场生命', '虚拟潮汐', '感知晶体', '代理花园', '空间语法', '雾中接口',
  '群体智能', '无重力剧场', '预测风景', '数据孢子', '自组织塔', '下一种现实',
] as const

const subtitles = [
  '生成影像装置', '实时数据雕塑', '空间声光实验', '沉浸式媒介作品',
  '参数化艺术研究', '数字文化遗产', '材料与算法', '交互原型',
] as const

const artists = [
  '林澜工作室', 'Northstar Lab', '陆屿', 'Studio Meridian', '周砚', 'Future Matter',
  '白昼计划', 'Vector Field', '顾远', 'Atelier Zero', '许雾', 'Common Form',
] as const

const accents = ['#34d9ff', '#7479ff', '#9b6dff', '#48efbd', '#ffc96b', '#ff6da8'] as const

const categoryFor = (index: number, zone: ExhibitionZone): ExhibitCategory => {
  if (zone === 'A') return index % 3 === 0 ? 'generative' : 'digital-art'
  if (zone === 'B') return 'sculpture'
  if (zone === 'C') return index % 2 === 0 ? 'heritage' : 'industrial-design'
  return index % 2 === 0 ? 'hologram' : 'generative'
}

const kindFor = (index: number, zone: ExhibitionZone): ExhibitDisplayKind => {
  if (index === 13 || index === 15 || index === 25 || index === 27) return 'imported-model'
  if (zone === 'A') return 'painting'
  if (zone === 'B') return 'procedural-sculpture'
  if (zone === 'C') return 'relic'
  return 'hologram'
}

const wallXs = [-20, -17, -14, -11, -8, -5, 5, 8, 11, 14, 17, 20] as const
const sideZs = [-12.5, -8.2, -3.9, 3.9, 8.2, 12.5] as const
const centerXs = [-13.2, -4.4, 4.4, 13.2] as const
const centerZs = [-7.2, 0, 7.2] as const

function makeExhibit(
  boothNumber: number,
  zone: ExhibitionZone,
  position: readonly [number, number, number],
  rotationY: number,
): ExhibitConfig {
  const index = boothNumber - 1
  const displayKind = kindFor(index, zone)
  const imageUrl =
    boothNumber === 1
      ? '/artworks/digital-twin-gallery.png'
      : boothNumber === 2
        ? '/artworks/interactive-kiosk-study.png'
        : undefined
  const modelUrl =
    displayKind === 'imported-model'
      ? boothNumber % 2 === 0
        ? '/models/exhibition/stanford-bunny.glb'
        : '/models/exhibition/suzanne.glb'
      : undefined

  return {
    id: `exhibit-${String(boothNumber).padStart(2, '0')}`,
    boothNumber,
    zone,
    title: titles[index],
    subtitle: subtitles[index % subtitles.length],
    artist: artists[index % artists.length],
    year: 2020 + (index % 7),
    category: categoryFor(index, zone),
    displayKind,
    variant: index % 8,
    position,
    rotationY,
    accent: accents[index % accents.length],
    description: `${titles[index]}通过空间、材质与实时计算建立一套可被观察和交互的叙事。该展项在本项目中同时承担展品渲染、定位导航、设备联动和数字档案示例。`,
    modelUrl,
    imageUrl,
  }
}

const north = wallXs.map((x, index) => makeExhibit(index + 1, 'A', [x, 0, -14.9], 0))
const south = wallXs.map((x, index) => makeExhibit(index + 13, 'B', [x, 0, 14.7], Math.PI))
const west = sideZs.map((z, index) => makeExhibit(index + 25, 'C', [-22.8, 0, z], -Math.PI / 2))
const east = sideZs.map((z, index) => makeExhibit(index + 31, 'C', [22.8, 0, z], Math.PI / 2))
const center = centerZs.flatMap((z, row) =>
  centerXs.map((x, column) => {
    const index = row * centerXs.length + column
    const rotation = row % 2 === 0 ? 0 : Math.PI
    return makeExhibit(index + 37, 'D', [x, 0, z], rotation)
  }),
)

export const exhibitionExhibits: readonly ExhibitConfig[] = [
  ...north,
  ...south,
  ...west,
  ...east,
  ...center,
]

export const getExhibitById = (id: string | null | undefined): ExhibitConfig | undefined =>
  id ? exhibitionExhibits.find((exhibit) => exhibit.id === id) : undefined

export const getExhibitsByZone = (zone: ExhibitionZone | 'ALL'): readonly ExhibitConfig[] =>
  zone === 'ALL' ? exhibitionExhibits : exhibitionExhibits.filter((exhibit) => exhibit.zone === zone)

export const exhibitionSchedule: readonly ExhibitionScheduleItem[] = [
  { id: 'schedule-1', time: '09:30', title: '开馆与设备自检', location: '中央控制台', status: 'completed' },
  { id: 'schedule-2', time: '10:30', title: '数字艺术策展人导览', location: 'A 区', status: 'live' },
  { id: 'schedule-3', time: '13:30', title: '文物数字化公开课', location: 'C 区', status: 'scheduled' },
  { id: 'schedule-4', time: '15:00', title: '未来材料圆桌', location: 'B 区', status: 'scheduled' },
  { id: 'schedule-5', time: '16:20', title: '全息装置演示', location: 'D 区', status: 'scheduled' },
] as const

export const exhibitionDevices: readonly ExhibitionDevice[] = [
  { id: 'device-1', name: '主墙导航屏', zone: '公共区', kind: 'display', status: 'online', value: '4K · 60 Hz' },
  { id: 'device-2', name: '访客交互终端', zone: '公共区', kind: 'display', status: 'online', value: '触控正常' },
  { id: 'device-3', name: '轨道射灯组 A', zone: 'A', kind: 'lighting', status: 'online', value: '78%' },
  { id: 'device-4', name: '恒温恒湿机组', zone: 'C', kind: 'environment', status: 'online', value: '22.6°C' },
  { id: 'device-5', name: '全息雾幕控制器', zone: 'D', kind: 'display', status: 'warning', value: '需要校准' },
  { id: 'device-6', name: '入口客流相机', zone: '公共区', kind: 'security', status: 'online', value: '128 人/时' },
  { id: 'device-7', name: '展柜照度传感器', zone: 'C', kind: 'environment', status: 'online', value: '168 lux' },
  { id: 'device-8', name: '紧急出口指示', zone: '公共区', kind: 'security', status: 'online', value: '正常' },
] as const
