# 工程扩展指南

## 1. 替换成真实楼宇模型

程序化 `Building.tsx` 可以按楼宇逐步替换，不需要一次性改写整个场景。

```tsx
import { useGLTF } from '@react-three/drei'

export function RealBuilding() {
  const { scene } = useGLTF('/models/tower-a.glb')
  return <primitive object={scene} />
}
```

生产实现应在加载后遍历材质，为需要发光的玻璃、灯带和屋顶边线分配明确材质名称。不要通过“模型中所有蓝色材质都发光”这种脆弱规则做识别。建议在数字内容创作工具中使用 `Facade`, `Glass`, `RoofGlow`, `Interior`, `Equipment` 等语义化材质名称。

楼宇拾取应绑定到一个稳定的业务标识，而不是依赖网格名称。可以在模型根节点写入 `userData.buildingId`，或者用 React 组件闭包绑定建筑配置。

## 2. 接入地理信息系统

当前版本已经包含 CesiumJS 双引擎模式。`src/data/gis.ts` 定义 WGS84 锚点、功能分区和局部米制坐标到经纬度的转换；`src/components/gis/CesiumMap.tsx` 使用 East-North-Up 固定框架把 Three.js 园区坐标放到地球上。

```text
Three.js 局部米制坐标
        │
        ├─ East / North / Up
        ▼
Cesium ENU 固定框架
        │
        ▼
WGS84 / Earth-Centered, Earth-Fixed
```

全国或城市尺度浏览使用 Cesium，园区内部高表现力漫游继续使用 React Three Fiber。两个引擎通过楼宇业务标识和 Zustand 状态切换，不直接共享场景对象。外部 3D Tiles、Cesium ion 和 OSM Buildings 的配置见 `docs/ENVIRONMENT_GIS_EXTENSION.md`。

## 3. 接入建筑信息模型

建筑信息模型不应原样全部发送到浏览器。Revit 或 Industry Foundation Classes（IFC）模型通常包含大量重复构件、不可见细节和工程元数据，需要建立离线转换流水线。

```text
Revit / IFC
    │
    ├─ 几何清理：删除螺栓、隐藏层、重复面
    ├─ 语义拆分：建筑 / 楼层 / 房间 / 专业系统
    ├─ 坐标归一：统一原点、单位、轴向
    ├─ 合批与实例化：重复构件复用
    ├─ 压缩：Draco 或 Meshopt
    └─ 输出：GLB + 业务元数据索引
```

推荐将大模型拆成园区、建筑、楼层和专业系统多个包，根据视角按需加载。不要把几百兆字节的整园区建筑信息模型作为单个 GLB 在首屏加载。

## 4. 实时数据接入

当前 `DigitalTwinDataSource` 是替换边界。REST 适合低频统计和历史查询，WebSocket 适合秒级状态推送，MQTT 通常由后端网关消费后再通过 WebSocket 或 Server-Sent Events 发送到浏览器。

```text
设备 / 传感器 / 楼控系统
          │
          ▼
   IoT Gateway / MQTT Broker
          │
          ▼
实时计算、规则引擎、时序数据库
          │
     ┌────┴────┐
     ▼         ▼
 WebSocket    REST
     │         │
     └────┬────┘
          ▼
DigitalTwinDataSource Adapter
          │
     Zustand / Query Cache
          │
   ┌──────┴──────┐
   ▼             ▼
Three.js       DOM Board
```

高频数据不要直接触发整个 React 树重渲染。设备动画可以写入 Three.js Object3D 引用或实例化缓冲区；秒级业务指标可以进入 Zustand；分钟级历史曲线可以使用查询缓存。

## 5. 设备点位与告警

少量关键点位可使用 Drei Html。大量点位不应创建几千个 DOM 节点，应该使用 InstancedMesh 或 Points，在靠近相机、被选中或告警时才创建 Html 详情卡。

建议建立以下选择状态：

```text
viewMode
  ├─ campus
  ├─ building
  ├─ floor
  └─ room

selection
  ├─ buildingId
  ├─ floorId
  ├─ roomId
  └─ deviceId
```

告警状态应单独建模，不要把“材质颜色”当作告警数据本身。业务状态驱动视觉状态，而不是反过来。

## 6. 路由与深链接

生产系统建议把选择状态同步到统一资源定位符（URL）：

```text
/campus/demo
/campus/demo/buildings/tower-a
/campus/demo/buildings/tower-a/floors/5
/campus/demo/buildings/tower-a/floors/5/devices/ahu-12
```

这样用户可以刷新、分享链接、从告警列表直接跳转到设备，也有利于权限控制和自动化测试。

## 7. 权限、国际化和审计

Board 层属于普通 React DOM，因此可以正常接入权限组件、国际化字典、操作审计和表单。三维对象的交互权限也应由同一业务权限模型决定，例如无设备运维权限的用户只能查看状态，不能执行远程控制。
