# Computer Graphics Field Guide

面向熟悉 `game state / game loop / mechanics`、但刚开始学习浏览器图形与动画的 JavaScript 交互课程。它不用引擎黑盒：每一节把状态、公式、顶点和最终画面同时放出来。

`assets/sanae-reference.jpeg` 是贯穿课程的参考图；它在坐标系、矩阵、向量和光照实验中被直接显示，用来把抽象数学回扣到一个实际角色资产。

## 学习路线

1. **Coordinate spaces**：local、world、view、screen 到底是同一个点的哪几种描述。
2. **Linear algebra**：vector、长度、加法、dot product，以及它们为何出现在方向和光照中。
3. **Model matrix**：用齐次坐标把 scale / rotate / translate 组合为 `T · R · S · p`。
4. **Camera & projection**：`P · V · M`、FOV、透视除法与近大远小。
5. **Rasterization**：barycentric interpolation、normal、Lambert light、fragment 的概念。
6. **Mesh deformation**：time 驱动的 vertex displacement；这是旗帜、水面和果冻的入口。
7. **Skeleton skinning**：bone matrices、weights、Linear Blend Skinning、两骨骼 IK。

## 运行

```bash
python3 -m http.server 8094 --directory graphics-animation-lab
```

打开 `http://localhost:8094`。

这套工具使用 Canvas 2D 故意把顶点和三角形画出来。迁移到 WebGL、Three.js 或 Godot 时，顶点属性、变换矩阵、蒙皮权重和渲染循环的基本数学保持一致，只是大量循环会在 GPU 上执行。
