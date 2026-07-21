# WebGL 性能治理手册

## 1. 先测量再优化

至少监控帧率、主线程时间、Graphics Processing Unit（GPU）时间、draw calls、三角形数量、纹理显存、JavaScript heap、首屏下载量和模型解析时间。不要仅凭肉眼判断“看起来不卡”。

## 2. Draw Calls

树木、路灯、停车位、传感器和重复窗格应使用 InstancedMesh。本 Starter 的树木和远景城市体块已经使用 Drei Instances。对于几千个设备点位，实例化通常比减少单个设备的三角形更重要。

```text
错误：1000 个设备 = 1000 Mesh = 1000 次左右 draw call
正确：1000 个设备 = 1 InstancedMesh = 1 次左右 draw call
```

## 3. React 更新边界

每帧动画应通过 `useFrame` 修改 Object3D、材质 uniform 或 BufferAttribute，不要每帧调用 React setState。Board 的秒级数值更新和三维的 60 帧动画应分开。

## 4. 选择与射线拾取

大规模场景可引入 three-mesh-bvh 加速复杂网格射线检测。实例化对象应通过 `instanceId` 解析业务实体。不可交互的远景模型应关闭或覆盖 raycast，避免每次指针移动都参与检测。

## 5. 层级细节与视锥裁剪

远景楼宇使用低精度 Level of Detail（LOD），近景才加载窗框、设备和室内。默认视锥裁剪适用于正常包围盒；动态修改顶点后要正确更新 bounding sphere 或 bounding box。

## 6. 透明与后期处理

透明材质会增加排序和 overdraw。楼宇内部模式中的透明外壳应保持低面数，尽量避免多层全屏透明平面。

Bloom、Screen Space Ambient Occlusion（SSAO）、Depth of Field（DOF）等后期效果都需要额外渲染通道。应建立高、中、低三个质量档，并对移动端降低分辨率、阴影贴图和后期效果。

## 7. 像素比

Retina 屏幕的 `devicePixelRatio` 可能显著增加像素填充成本。通常将 WebGL 像素比限制在 1.5 至 2.0 之间比盲目使用设备原生像素比更稳定。Starter 使用受限的 device pixel ratio，并保留 React Three Fiber 的 performance 配置作为自适应优化入口。

## 8. 标签

Html 标签数量应受控。宏观视角只显示重要建筑和告警；缩放后再显示房间和设备。标签应进行距离裁剪、聚合和遮挡策略，避免大量 DOM 布局计算。

## 9. 建议质量档

| 选项 | 高 | 中 | 低 |
|---|---:|---:|---:|
| Pixel Ratio | 1.75 | 1.35 | 1.0 |
| Shadow Map | 2048 | 1024 | 关闭或 512 |
| Bloom | 高质量 mipmap | 标准 | 关闭 |
| Contact Shadows | 512 | 256 | 关闭 |
| 粒子 | 100% | 50% | 20% |
| 标签 | 全部关键标签 | 仅告警与选中 | 仅选中 |
