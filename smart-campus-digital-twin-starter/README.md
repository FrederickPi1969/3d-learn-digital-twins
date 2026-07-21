# 智慧园区数字孪生 Extension Suite

这是一个可直接本地部署、可继续工程化扩展的智慧园区与智能楼宇数字孪生前端工程。当前版本在原始园区与楼宇剖析能力上，新增了完整的天气、植被、动态实体、三维夜景和 Cesium 地理信息系统桥接模块。

项目默认不依赖外部模型、地图服务或云端接口即可运行。Three.js 园区视图使用程序化楼宇、道路、停车场、植被和动态实体；Cesium 视图默认使用离线网格底图。配置 Cesium ion Token、3D Tiles URL 或 ion Asset ID 后，可以进一步加载全球建筑和外部地理空间数据。

## 快速启动

```bash
npm ci
npm run dev
```

默认开发地址为 `http://localhost:5173`。

生产构建与预览：

```bash
npm run build
npm run preview
```

Docker 部署：

```bash
docker compose up --build
```

默认 Docker 地址为 `http://localhost:8080`。

项目要求 Node.js 20.19 或更高版本。仓库包含锁定依赖版本的 `package-lock.json`。

## 当前实现

| 能力 | 实现方式 |
|---|---|
| 园区拖动、缩放、旋转 | Three.js MapControls；左键平移、滚轮缩放、右键旋转 |
| 楼宇拾取与进入 | React Three Fiber 指针拾取、楼宇悬停反馈、阻尼镜头过渡 |
| 楼宇内部剖析 | 半透明外壳、楼层爆炸视图、房间状态、垂直数据流、扫描面和楼宇级 Board |
| 天气系统 | 图形处理器粒子着色器实现降雨、降雪和沙尘；摄像机跟随体积；地面涟漪、积雪和尘雾覆盖 |
| 雷暴与云层 | 程序化云层、随机闪电、环境光和雾化联动 |
| 植被 | InstancedMesh 批量渲染乔木、针叶树和灌木；确定性布局；建筑和道路碰撞避让 |
| 植被风摆 | `onBeforeCompile` 注入顶点着色器，风摆幅度与天气风速联动 |
| 动态车辆 | Catmull–Rom 样条路径、实例化车体、车窗、前后灯与少量移动点光源 |
| 动态人员 | 实例化身体、头部和腿部；沿步行路径循环移动；包含步态摆动和上下起伏 |
| 三维夜景 | 程序化天空、星空、月亮、暖色窗光、青蓝轮廓灯、路灯光池、探照灯、湿地反射和 Bloom |
| 后期处理 | Bloom、亮度对比度、色相饱和度、噪声和暗角，按昼夜和天气动态调节 |
| 地理信息系统模式 | CesiumJS Viewer、WGS84 地球坐标、局部 East-North-Up 坐标桥接、GeoJSON 功能分区 |
| 外部地理数据 | 支持 3D Tiles URL、Cesium ion Asset ID 和 Cesium OSM Buildings |
| 双引擎联动 | Cesium 单击选择楼宇；双击楼宇切回 Three.js 并进入对应楼宇内部模式 |
| 运行时控制 | 天气、强度、风速、雷暴、昼夜、路灯、探照灯、绿化密度、车辆、人员、速度和 GIS 图层 |
| 工程质量 | TypeScript 严格模式、ESLint、Vitest、Vite 生产构建、Docker、Nginx 和 Cesium 静态资源部署 |

## 双引擎架构

```text
                                  React DOM HUD
              ┌────────────────────────────────────────────────┐
              │ 顶栏 / 宏观 Board / 楼宇 Board / 工具栏 / 面板 │
              └──────────────────────┬─────────────────────────┘
                                     │ Zustand 共享状态
                       ┌─────────────┴─────────────┐
                       │                           │
             renderMode = twin          renderMode = gis
                       │                           │
                       ▼                           ▼
       React Three Fiber + Three.js              CesiumJS
       ┌───────────────────────────┐   ┌─────────────────────────────┐
       │ 局部米制园区坐标           │   │ WGS84 地球坐标              │
       │ 楼宇 / 室内 / 道路         │   │ 离线网格底图                 │
       │ 天气 / 植被 / 人车         │   │ 本地 ENU 园区实体            │
       │ 夜景 / 后期处理            │   │ GeoJSON / 3D Tiles / OSM     │
       └──────────────┬────────────┘   └──────────────┬──────────────┘
                      │                               │
                      └──────── 楼宇业务标识 ─────────┘
                         tower-a / tower-b / ...
```

Three.js 负责园区级高表现力数字孪生和单体楼宇内部效果。Cesium 负责城市、区域和全球尺度的地理空间组织。两个引擎不共享同一个 WebGL 场景，而是通过稳定的楼宇业务标识、地理锚点和 Zustand 状态进行切换和联动，这种边界比强行把两套渲染器叠在同一个 Canvas 中更容易维护。

## 页面与渲染层级

```text
浏览器窗口
┌──────────────────────────────────────────────────────────────────────┐
│ HUD：顶栏、状态条、左侧 Board、右侧 Board、底部导航、扩展控制中心   │
│                                                                      │
│  Three.js 模式                              Cesium 模式               │
│  ┌────────────────────────────┐             ┌──────────────────────┐ │
│  │ EnvironmentRig             │             │ Viewer / Globe       │ │
│  │ BackdropCity               │             │ GridImageryProvider  │ │
│  │ CampusGround + ScanGrid    │             │ Local ENU Campus     │ │
│  │ Roads + Buildings          │             │ GeoJSON Zones        │ │
│  │ Trees + DynamicEntities    │             │ Optional 3D Tiles    │ │
│  │ NightLighting              │             │ GIS Weather Overlay  │ │
│  │ WeatherSystem              │             └──────────────────────┘ │
│  │ Postprocessing             │                                      │
│  └────────────────────────────┘                                      │
│                                                                      │
│                  Bottom Navigation + Scene Toolbar                   │
└──────────────────────────────────────────────────────────────────────┘
```

## 快捷键

| 按键 | 行为 |
|---|---|
| `W` | 循环切换晴朗、降雨、降雪和沙尘 |
| `N` | 循环切换日间、黄昏、夜景和自动昼夜 |
| `G` | 切换 Three.js 数字孪生与 Cesium 地理信息系统 |
| `E` | 打开或关闭扩展控制中心 |
| `R` | 重置当前渲染引擎的摄像机 |
| `L` | 显示或隐藏楼宇标签 |
| `Escape` | 关闭扩展面板，或从楼宇模式返回园区 |

## 技术栈

| 层级 | 方案 | 作用 |
|---|---|---|
| 构建与开发 | Vite + TypeScript | 热更新、严格类型、代码分块和生产构建 |
| 用户界面 | React 19 + Motion | Board、控制面板、视图切换和界面过渡 |
| 三维渲染 | Three.js + WebGL | 几何、材质、着色器、灯光、相机、实例化和拾取 |
| React 三维绑定 | React Three Fiber | 用 React 组件组织 Three.js 场景图 |
| 三维工具集 | Drei | MapControls、Html、Edges、Instances、反射材质和自适应像素比 |
| 后期处理 | React Postprocessing | Bloom、颜色校正、噪声和暗角 |
| 地理信息系统 | CesiumJS | WGS84 地球、局部 ENU、GeoJSON、3D Tiles 和 OSM Buildings |
| 应用状态 | Zustand | 双引擎、视角、楼宇、楼层、天气、灯光、实体和 GIS 图层状态 |
| 测试与质量 | ESLint + Vitest | 静态检查、状态、坐标转换和程序化数据测试 |
| 部署 | Nginx + Docker | 静态站点部署、单页应用回退和 Cesium 运行资源分发 |

## 环境变量

复制示例文件：

```bash
cp .env.example .env
```

```dotenv
# 可选。离线 GIS 示例不需要 Token。
VITE_CESIUM_ION_TOKEN=

# 可选。外部 3D Tiles 的 tileset.json 地址。
VITE_CESIUM_3D_TILES_URL=

# 可选。Cesium ion 中的 3D Tiles Asset ID。
VITE_CESIUM_ION_ASSET_ID=
```

没有 Token 时，Cesium 模式仍会显示离线网格地球、园区楼宇、道路、绿化和 GeoJSON 分区。Cesium OSM Buildings 和 ion Asset ID 需要有效 Token。外部 URL 方式还需要资源服务器允许浏览器跨域访问。

## 关键目录

```text
src/
├── components/
│   ├── scene/
│   │   ├── EnvironmentRig.tsx          天空、雾、昼夜、主光和闪电
│   │   ├── WeatherSystem.tsx           三维天气粒子、云层和地面覆盖
│   │   ├── Trees.tsx                   实例化植被和顶点风摆
│   │   ├── DynamicEntities.tsx         车辆与员工路径动画
│   │   ├── NightLighting.tsx           路灯、光池和楼顶探照灯
│   │   ├── Building.tsx                程序化幕墙、窗光和楼宇拾取
│   │   ├── CampusGround.tsx            地面、停车场和屏幕空间反射
│   │   ├── SceneEffects.tsx            后期处理
│   │   └── BuildingInterior.tsx        楼宇内部剖析
│   ├── gis/
│   │   └── CesiumMap.tsx               Cesium Viewer 和双引擎联动
│   └── hud/
│       └── EnvironmentControlPanel.tsx 环境与 GIS 扩展控制中心
├── data/
│   ├── campus.ts                       园区、楼宇、道路和停车场配置
│   ├── environment.ts                  植被、路灯、人员路径和夜景锚点
│   └── gis.ts                          地理锚点、分区和 GeoJSON 转换
├── store/useDigitalTwinStore.ts        全局状态与动作
├── services/digitalTwinDataSource.ts   业务遥测数据源边界
└── styles/                             HUD、Cesium 和扩展面板样式
```

## 最常修改的入口

园区楼宇、道路和停车场：

```text
src/data/campus.ts
```

植被生成区域、路灯采样、人员路线和探照灯楼宇：

```text
src/data/environment.ts
```

真实项目经纬度锚点和功能分区：

```text
src/data/gis.ts
```

环境和 GIS 控件：

```text
src/components/hud/EnvironmentControlPanel.tsx
```

真实数据接入边界：

```text
src/services/digitalTwinDataSource.ts
```

## Cesium 静态资源

Cesium 运行时会动态请求 `Workers`、`Assets`、`ThirdParty` 和 `Widgets`。Vite 构建配置会把这些目录复制到：

```text
dist/cesium/Workers
dist/cesium/Assets
dist/cesium/ThirdParty
dist/cesium/Widgets
```

`CESIUM_BASE_URL` 设置为 `/cesium/`。不要在部署时只上传 `dist/assets` 而遗漏 `dist/cesium`，否则地理信息系统模式会出现 Worker 或资源加载错误。

## 验证命令

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run validate:release
```

当前版本通过 TypeScript 严格类型检查、ESLint、5 个测试文件中的 14 项测试，以及包含 389 个 Cesium 运行资源的 Vite 生产构建。

## 文档

`CHANGELOG.md` 只列出本次扩展相对于原始 Starter 的新增内容。

`docs/ENVIRONMENT_GIS_EXTENSION.md` 详细说明天气、绿化、动态实体、夜景、双引擎坐标和 3D Tiles 接入设计。

`docs/PROJECT_ANALYSIS.md` 解释参考大屏的布局、镜头、光效和三维表达。

`docs/ASSET_PIPELINE.md` 给出从数字内容创作工具或建筑信息模型到 Web 端 GLB 的资产规范。

`docs/PERFORMANCE_PLAYBOOK.md` 给出大园区、海量点位和移动端的性能治理策略。
