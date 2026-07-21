# 智慧园区数字孪生与未来艺术馆套件

当前版本为 `4.0.0`。它在智慧园区、智能楼宇、环境天气、三维夜景和 Cesium 地理信息系统能力之上，提供一套高明度白色未来艺术馆、四块三维动态媒体屏、直接嵌入中央展墙的访客操作系统，以及可扩展的数字资产接入管线。

项目不要求外部应用程序接口、在线地图或云服务即可启动。展厅、48 个展位、程序化展品、十八件本地 GLB 模型（十六件项目自有程序化资产与两件轻量示例）、三组本地循环视频及海报、本地展览网页、墙内虚拟桌面和大屏平面图全部随源码交付。Cesium ion、外部 3D Tiles、互联网网页和外部数字资产目录均为可选能力。

## 启动

要求 Node.js 20.19 或更高版本。

```bash
npm ci
npm run dev
```

默认地址：

```text
http://localhost:5173
```

默认落地体验由 `.env` 中的 `VITE_DEFAULT_EXPERIENCE` 决定，当前示例配置为 `exhibition`。也可以分别使用 `npm run dev:exhibition` 和 `npm run dev:campus` 启动指定体验。

直接进入未来艺术馆：

```text
http://localhost:5173/?experience=exhibition
```

生产构建：

```bash
npm run build
npm run validate:release
npm run preview
```

Docker 部署：

```bash
docker compose up --build
```

Docker 默认地址：

```text
http://localhost:8080
```

## 三套体验

```text
                           同一个 React 应用
                                  │
                 ┌────────────────┼────────────────┐
                 │                │                │
                 ▼                ▼                ▼
         Three.js 园区       Cesium GIS       未来艺术馆
         楼宇与室内          地球与 3D Tiles    展厅与虚拟系统
                 │                │                │
                 └────────────────┴────────────────┘
                           Zustand 状态边界
```

智慧园区模式包含园区拖动、缩放、旋转、楼宇拾取、楼宇内部剖析、天气、植被、人员车辆和夜景。Cesium 模式包含 WGS84 地球坐标、East-North-Up 局部坐标桥接、GeoJSON、3D Tiles 和园区业务对象联动。未来艺术馆模式独立按需加载，避免展厅代码进入园区首屏的同步渲染路径。

## 未来艺术馆实现范围

展厅包含 48 个可交互展位，分为数字艺术、当代雕塑、文物设计和未来实验四个策展区，每区 12 个展位。展位数据统一定义在 `src/data/exhibition.ts`，展品类型包括数字画作、程序化雕塑、文物展柜、全息装置和导入的 GLB 模型。

展厅几何采用程序化白色建筑骨架，包含高反射白色树脂地面、冷白墙体、顶部采光井、黑色轨道灯、暖白展品射灯、浅青导光边框和轻空间雾。光照管线包含程序化环境光场、物理材质、局部点光源、聚光灯、接触阴影、Bloom、色调调整、轻暗角和噪声。镜头使用 `camera-controls`，支持平滑阻尼、拖动旋转、滚轮缩放、光标位置缩放和展品自动聚焦。

墙面数字大屏在三维空间内嵌套真实 React 界面，显示 48 个展位的平面图、分区、客流、设备在线率和当前位置。点击大屏内展位可以同步选择三维展品；双击大屏或点击“打开全屏导航”会打开全屏平面图。访客终端不再是独立的二维覆盖层或落地面板，而是嵌入中央展墙正面的真实三维屏幕。完整桌面、窗口系统、浏览器和业务应用都在该屏幕表面运行，关闭会话后恢复待机吸引界面。

环境中还包含可调数量的程序化访客。访客使用共享几何体、材质和循环路径，避免为每个人建立复杂骨骼动画。两侧墙面、入口媒体横屏和中央展墙背面共放置四块本地动态媒体屏，使用 `THREE.VideoTexture` 循环播放，支持暂停、亮度联动、海报回退和浏览器自动播放重试。展厅展品同时使用程序化几何与十八件轻量本地 GLB，以保持丰富度、首屏体积和替换成本之间的平衡。

## 轻量级虚拟操作系统

虚拟系统并不试图模拟完整 Windows 内核。它是运行在当前 React 应用内部的访客操作环境，提供桌面、开始菜单、任务栏、系统托盘、通知区域、窗口管理和六个内置应用。

```text
虚拟桌面
├── Exhibition Browser        浏览器
├── Exhibition Floor Map      展厅导航
├── Digital Collection        数字展册
├── Facility Operations       设备控制
├── Public Program            活动日程
└── System Settings           系统设置
```

窗口由 `react-rnd` 实现，可拖动、缩放、最小化、最大化、聚焦和关闭。图标使用 `lucide-react`，过渡动画使用 Motion。虚拟系统只在墙面终端会话打开时挂载；关闭后不会持续占用窗口布局、视频以外的应用定时器或 iframe 资源。

浏览器应用具备地址栏、前进、后退、刷新、主页、快速链接、浏览历史和外部打开。随项目附带三个本地网页：展厅首页、数字展册和参观指南，能够在任何本地部署环境中稳定加载。

外部网页通过受限 `iframe` 加载。这是浏览器允许的真实网页嵌入方式，但无法绕过目标站点的 `Content-Security-Policy` 或 `X-Frame-Options`。禁止被嵌套的网站会显示空白或拒绝加载，此时可使用浏览器工具栏中的“外部打开”。这属于浏览器安全边界，不是本项目缺陷。生产环境建议将允许访问的地址改为白名单，并按业务要求调整 iframe 的 `sandbox` 权限。

## 交互方式

园区底部导航中的“未来展厅”进入展厅，`H` 在园区和展厅之间切换。展厅内使用鼠标拖动旋转，滚轮缩放，点击展品聚焦。数字键 `1` 切换总览，`2` 聚焦导航大屏，`3` 聚焦中央墙面终端，`M` 打开平面图，`O` 聚焦终端并启动虚拟系统，`Escape` 按层级关闭终端会话、平面图或展品选择。底部控制坞新增“动态屏”开关，终端设置应用可调节媒体屏亮度。

## 技术栈

| 层级 | 技术 | 用途 |
|---|---|---|
| 应用框架 | React 19、TypeScript、Vite | 应用外壳、类型系统、代码分块和构建 |
| 三维场景 | Three.js、React Three Fiber | 展厅、展品、灯光、材质、拾取和动画 |
| 三维组件 | Drei、camera-controls | HTML 屏幕、圆角几何、阴影、相机控制和资源加载 |
| 视觉后期 | React Postprocessing、postprocessing | Bloom、色彩、噪声和暗角 |
| 窗口系统 | react-rnd | 可拖动、可缩放的桌面应用窗口 |
| 图标与动效 | Lucide React、Motion | 虚拟桌面图标和界面过渡 |
| 状态管理 | Zustand | 园区、GIS、展厅、镜头、展品和应用状态 |
| 地理信息系统 | CesiumJS | WGS84、GeoJSON、3D Tiles 和地球级视图 |
| 质量与部署 | ESLint、Vitest、Nginx、Docker | 静态检查、测试、构建和静态部署 |

## 关键目录

```text
src/
├── components/
│   ├── exhibition/
│   │   ├── scene/                 白色展厅、灯光、展位、动态屏、嵌入墙、访客、相机、后期
│   │   ├── ui/                    展厅 HUD、平面图、展签、控制坞
│   │   └── os/                    虚拟桌面、窗口系统和六个应用
│   ├── scene/                     智慧园区 Three.js 场景
│   ├── gis/                       Cesium 地理信息系统
│   └── hud/                       园区 HUD 与模式导航
├── data/
│   ├── exhibition.ts              48 个展位、展品、日程和设备数据
│   ├── exhibitionAssets.ts        本地模型注册表与六类资产渠道
│   ├── campus.ts                  园区数据
│   ├── environment.ts             天气、植被、人车和灯光锚点
│   └── gis.ts                     地理锚点和 GeoJSON 转换
├── store/
│   ├── useExhibitionStore.ts      展厅与虚拟系统状态
│   └── useDigitalTwinStore.ts     园区、GIS 与体验模式状态
└── styles/exhibition.css          展厅 HUD、地图、虚拟桌面和应用样式

public/
├── artworks/                      本项目演示画作
├── media/exhibition/              动态屏本地 MP4 与海报
├── models/exhibition/             十八件可替换的本地学习模型与来源清单
├── environments/                  展厅环境贴图
├── draco/                         GLB Draco 解码器
└── embedded/                      浏览器内置的本地网页
```

## 常见扩展入口

新增或替换展品时，先编辑 `src/data/exhibition.ts`。普通画作可填写 `imageUrl`，导入模型可填写 `modelUrl`，展品的空间位置使用 `[x, y, z]` 米制局部坐标。新增展品类型时扩展 `ExhibitDisplayKind`，再在 `src/components/exhibition/scene/ExhibitBooth.tsx` 中增加对应渲染分支。

新增虚拟系统应用时，在 `src/types/exhibition.ts` 中扩展 `ExhibitionAppId`，在 `src/components/exhibition/os/apps/` 下创建应用组件，然后在 `VirtualOSDesktop.tsx` 中注册标题、图标、默认尺寸和渲染映射。窗口拖动、层级、最大化和任务栏行为不需要重新实现。

接入真实展厅数据时，建议保持 `ExhibitConfig` 作为前端稳定模型，在数据源适配层完成后端字段映射。设备状态、客流、日程和展品内容可以分别接入 Hypertext Transfer Protocol、WebSocket、Message Queuing Telemetry Transport 网关或数字资产管理系统，不应让三维组件直接依赖后端响应结构。

模型资产建议使用 GLB，桌面展品控制在约 20,000 至 80,000 个三角形，批量展品优先复用材质和纹理图集。大模型应使用网格简化、KTX2 纹理、Draco 或 Meshopt 压缩，并按视距设置 Level of Detail。项目提供 `npm run assets:sync -- <manifest>`，用于从本地文件、公开目录或私有数字资产管理导出的清单中同步 GLB，并执行尺寸、二进制头和可选 SHA-256 校验。详细规范见 `docs/ASSET_PIPELINE.md` 与 `docs/DIGITAL_ASSET_CHANNELS.md`。

## Cesium 环境变量

```bash
cp .env.example .env
```

```dotenv
VITE_CESIUM_ION_TOKEN=
VITE_CESIUM_3D_TILES_URL=
VITE_CESIUM_ION_ASSET_ID=
```

没有 Token 时，Cesium 模式仍会显示本地园区对象和离线网格地球。外部 3D Tiles 还需要资源服务器允许跨域访问。

## 生产部署注意事项

Cesium 会在运行时动态加载 `Workers`、`Assets`、`ThirdParty` 和 `Widgets`。Vite 构建把这些文件复制到 `dist/cesium/`，并将 `CESIUM_BASE_URL` 设置为 `/cesium/`。部署时必须完整上传 `dist`，不能只上传 `dist/assets`。

单页应用服务器需要把未知路径回退到 `index.html`，但不得把模型、纹理、嵌入网页或 Cesium Worker 的真实 404 错误改写成 HTML。仓库中的 Nginx 配置已经处理了这些路径。

## 验证

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run validate:release
```

`validate:release` 会验证主入口、未来艺术馆异步代码块、Cesium 运行资源、十八件 GLB（十六件策展资产与两件基础示例）、本地动态视频与海报、白色展厅样式、墙面嵌入式操作系统样式、环境贴图、演示画作和内置网页是否完整进入生产目录，并拒绝错误嵌套的 Cesium `node_modules` 路径。

更详细的展厅设计说明见 `docs/EXHIBITION_HALL_EXTENSION.md`，虚拟浏览器的安全边界见 `docs/VIRTUAL_OS_BROWSER_NOTES.md`，第三方素材与依赖说明见 `ATTRIBUTIONS.md`。
