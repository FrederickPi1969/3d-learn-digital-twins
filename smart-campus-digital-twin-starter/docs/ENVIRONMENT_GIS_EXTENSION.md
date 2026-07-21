# 环境、夜景、动态实体与 GIS 扩展设计

## 1. 模块边界

扩展没有把所有逻辑堆进 `CampusScene.tsx`。场景总编排只决定模块是否挂载，具体渲染和动画由独立组件完成。

```text
CampusScene
├── EnvironmentRig
│   ├── SkyDome
│   ├── StarField
│   ├── Moon
│   ├── Ambient / Hemisphere / Directional Lights
│   └── Lightning Point Light
├── BackdropCity
├── CampusGround
├── Roads
├── Trees
├── Buildings
├── DynamicEntities
│   ├── Vehicles
│   └── Pedestrians
├── NightLighting
│   ├── StreetLights
│   └── Searchlights
├── WeatherSystem
│   ├── CloudDeck
│   ├── WeatherParticles
│   └── WeatherGroundOverlay
└── SceneEffects
```

这种拆分有两个目的。第一，天气、植被、人车、夜景和地理信息系统可以分别替换，不要求一起重写。第二，每个模块能够明确管理自己的几何体、材质、着色器 Uniform、实例矩阵和资源释放。

## 2. 天气渲染

### 2.1 粒子空间

天气粒子不是固定在园区原点，而是在着色器中叠加摄像机水平位置。

```text
世界坐标中的天气体积

                 Camera
                   ●
        ┌───────────────────────┐
        │  Rain / Snow / Dust   │
        │  local particle box   │
        └───────────────────────┘
                   │
                   └── 每帧只更新 uCameraPosition
```

JavaScript 端只创建一次 `Float32Array`，其中包含粒子初始位置、随机种子和尺寸。每帧只更新少量 Uniform。粒子的下降、漂移、循环回绕和点精灵形状都在图形处理器中完成，因此不会为 12,000 个粒子创建 12,000 个 React 组件或 Three.js Mesh。

### 2.2 降雨

降雨粒子使用狭长点精灵。顶点着色器控制快速下降和随风偏移，片元着色器生成窄线形透明度。地面叠加层使用网格哈希生成多个不同生命周期的扩散环，从而模拟雨滴涟漪。

雨天还会改变道路和地面的粗糙度、金属度与反射强度。环境雾距离缩短，主方向光变弱，楼宇窗光和道路灯光相对更明显。

### 2.3 降雪

雪花速度低于雨滴，并叠加正弦和余弦横向摆动。地面覆盖使用程序化噪声生成非均匀积雪，而不是在全场铺一张纯白平面。雪天环境光略微提高，以模拟雪面对环境光的扩散反射。

### 2.4 沙尘

沙尘粒子主要做水平漂移，点精灵尺寸较大、透明度较低。环境背景、雾、太阳颜色、楼宇表面和道路高光都会切换到暖棕色系。能见度主要由 Fog 的 near 和 far 变化表达，而不是只在屏幕前覆盖一层半透明棕色。

### 2.5 雷暴

雷暴只在降雨、强度超过阈值且开关启用时触发。实现使用一个大范围 PointLight，并通过随机的下一次触发时间和快速衰减的强度包络产生非周期闪光。

```text
强度
  1.0 ┤   ┌─┐
      │   │ │
  0.0 ┼───┘ └────────────── 时间
          快速出现 / 快速衰减
```

## 3. 植被系统

### 3.1 生成与碰撞排除

`src/data/environment.ts` 定义多个种植区域。每个候选点使用确定性噪声生成，因此刷新页面后布局不变化。候选点需要同时满足：

```text
候选点
  │
  ├─ 不进入任意楼宇的扩展包围矩形
  ├─ 与任意道路中心线保持最小距离
  └─ 位于指定种植区域
       │
       ▼
    接受为植被实例
```

真实项目可以把种植区域替换为 GeoJSON 绿地面、园林设计图层或后端返回的点位。

### 3.2 实例化

树干、落叶树冠、针叶树冠和灌木分别使用 InstancedMesh。每个实例只存储变换矩阵和颜色，不创建独立 Mesh。密度滑块不会重新随机生成位置，而是从稳定数组中选择一个确定性的前缀。

### 3.3 风摆

风摆通过 `MeshStandardMaterial.onBeforeCompile` 修改顶点着色器。树冠顶部的权重大于底部，实例矩阵平移量参与相位计算，使不同树木不会完全同步摆动。

```text
顶点高度
  高 ───────── 风摆权重接近 1
      ╲
       ╲
  低 ──╲────── 风摆权重接近 0
```

## 4. 动态实体

### 4.1 车辆

车辆路径来自园区道路点集，并转换成 Catmull–Rom 曲线。每辆车的路线编号、初始相位、速度、尺度和颜色由确定性噪声生成。

每帧过程为：

```text
elapsedTime
    │
    ├─ 计算曲线进度 t
    ├─ curve.getPointAt(t) 得到位置
    ├─ curve.getTangentAt(t) 得到朝向
    ├─ 组装根矩阵
    ├─ 乘以车厢 / 车窗 / 车灯局部矩阵
    └─ 写入各 InstancedMesh 的 instanceMatrix
```

用于矩阵计算的 Vector3、Quaternion 和 Matrix4 保存在 Ref 中，避免每帧产生临时对象并增加垃圾回收压力。

### 4.2 员工

员工沿独立步行路径移动。身体、头部、左腿和右腿为四个 InstancedMesh。左右腿使用相反相位的正弦摆动，身体高度叠加绝对正弦产生轻微起伏。

当前员工模型是低成本占位符。替换为真实角色时，建议采用共享 SkinnedMesh、动画纹理或 Vertex Animation Texture，而不是为几十个角色分别创建完整骨骼更新树。

## 5. 夜景渲染

夜景不是单一的“把背景改黑”，而是多个参数同时变化。

```text
DayPhase
   │
   ├─ Sky / Fog
   ├─ Ambient and Hemisphere Light
   ├─ Directional Light
   ├─ Building Emissive Windows
   ├─ Street Lights and Light Pools
   ├─ Searchlights
   ├─ Backdrop Windows
   └─ Postprocessing
```

楼宇立面由两张程序化 CanvasTexture 组成。Color Map 描述暗色幕墙和窗格，Emissive Map 只保留亮窗和灯带。夜间提高 Emissive Intensity，Bloom 只对高亮区域产生辉光，从而避免整栋楼发白。

中心广场使用 MeshReflectorMaterial。雨天提高反射混合强度和镜面权重，夜间路灯与楼宇高光因此可以出现在地面。

路灯的灯杆、灯泡和光池使用实例化。只有稀疏采样的一部分路灯使用真实 PointLight，以避免几十个实时点光源带来的片元照明成本。探照灯使用旋转透明圆锥和 Additive Blending 表达体积光束。

## 6. Three.js 与 Cesium 的坐标桥接

### 6.1 坐标定义

Three.js 园区数据使用局部米制坐标：

```text
Three.js 本项目坐标

        +Z / North
             ↑
             │
             │
 West  ←─────┼─────→  +X / East
             │
             ↓
           South

+Y 表示高度
```

Cesium 使用 WGS84 地球固定坐标。`CAMPUS_GIS_ANCHOR` 定义园区原点的经度、纬度和高程。Cesium 的 `eastNorthUpToFixedFrame` 生成局部 East-North-Up 到 Earth-Centered, Earth-Fixed 的变换矩阵。

```text
局部园区点 [east, up, north]
             │
             ▼
       ENU 变换矩阵
             │
             ▼
Earth-Centered, Earth-Fixed Cartesian3
             │
             ▼
        Cesium Globe
```

本项目的二维配置是 `[east, north]`，在 Three.js 中映射为 `[x, z]`；高度映射为 Y。进入 Cesium 时，代码构造局部 Cartesian3 `[east, north, up]`，再乘以 ENU 固定框架矩阵。

### 6.2 GeoJSON

功能分区需要标准经纬度坐标。`localMetersToDegrees` 对园区几十米尺度使用局部线性近似，将 East 和 North 米数转换为经纬度增量。该近似适合单个园区的可视化分区；跨城市或高精度测绘项目应使用专业坐标转换库和项目坐标参考系统。

### 6.3 业务对象联动

Cesium Entity 的标识使用：

```text
campus-building:tower-a
```

选择时移除前缀，得到与 Three.js 配置一致的 `tower-a`。双击后调用共享 Store 的 `enterBuilding`，该动作会把 `renderMode` 切换为 `twin`，同时设置楼宇和默认楼层。因此两个渲染器不需要直接持有对方的对象引用。

## 7. 3D Tiles 接入

扩展控制中心提供两种来源：

```text
外部 URL
  └─ https://host/path/tileset.json

Cesium ion
  ├─ VITE_CESIUM_ION_TOKEN
  └─ VITE_CESIUM_ION_ASSET_ID
```

URL 优先于 Asset ID。加载前会移除旧 Tileset，避免重复图层。加载后对象加入 `viewer.scene.primitives`。外部资源需要正确的跨域响应头；私有资源的授权信息应由受控网关或短期令牌提供，不应把长期密钥直接写入公开前端仓库。

Cesium OSM Buildings 是独立开关，也需要 Cesium ion Token。

## 8. Cesium 静态运行资源

Cesium 的主 JavaScript 包不足以单独运行。Worker、纹理、天文数据和 Widget 资源在运行时按 URL 请求。构建配置将以下目录复制到 `dist/cesium`：

```text
node_modules/cesium/Build/Cesium/Workers     → dist/cesium/Workers
node_modules/cesium/Build/Cesium/Assets      → dist/cesium/Assets
node_modules/cesium/Build/Cesium/ThirdParty  → dist/cesium/ThirdParty
node_modules/cesium/Build/Cesium/Widgets     → dist/cesium/Widgets
```

`CESIUM_BASE_URL` 必须与部署路径一致。当前默认是根路径下的 `/cesium/`。部署到子路径时，需要同时修改 Vite base、`CESIUM_BASE_URL` 和服务器静态资源前缀。

## 9. 性能策略

```text
高频更新
  ├─ useFrame 内修改矩阵和 Uniform
  └─ 不调用 React setState

重复对象
  ├─ 树木 → InstancedMesh
  ├─ 车辆 → InstancedMesh
  ├─ 员工 → InstancedMesh
  └─ 路灯 → InstancedMesh + 少量真实灯光

大依赖
  ├─ Three.js 独立 Chunk
  └─ Cesium 独立 Lazy Chunk，仅进入 GIS 时加载
```

Three.js Canvas 使用 AdaptiveDpr 和 AdaptiveEvents。在相机交互开始时调用 performance regression，临时降低像素比和事件开销，静止后恢复。Cesium 作为 React lazy chunk，默认进入园区视图时不会立即执行 Cesium Viewer 初始化。

## 10. 真实项目替换路径

程序化模块可按以下顺序替换：

```text
第一阶段：保持当前占位场景
  └─ 接真实 REST / WebSocket 数据

第二阶段：替换园区空间数据
  ├─ campus.ts → 后端园区配置
  ├─ environment.ts → 园林与道路图层
  └─ gis.ts → 项目真实锚点和分区

第三阶段：替换三维资产
  ├─ 程序化楼宇 → GLB / 3D Tiles
  ├─ 占位车辆 → 压缩车辆模型
  └─ 占位员工 → 低成本角色动画

第四阶段：接城市级 GIS
  ├─ 正射影像
  ├─ 地形
  ├─ 城市 3D Tiles
  └─ 项目专题 GeoJSON / WMS / WMTS
```

## 11. 常见问题

Cesium 视图出现 Worker 404 时，先检查 `dist/cesium/Workers` 是否随部署上传，并检查 `/cesium/` 前缀是否正确。

外部 3D Tiles 加载失败而本地园区正常时，检查 URL、跨域响应头、鉴权和 tileset.json 内部相对资源路径。

天气粒子在低端设备上开销过高时，优先降低 `PARTICLE_COUNT`、Canvas 像素比和 Bloom，而不是为每个粒子增加更多 JavaScript 逻辑。

夜景过曝时，先检查发光材质的 Emissive Intensity 和 Bloom Threshold，再调整全局曝光。不要用降低所有灯光的方式掩盖单个材质过亮的问题。
