# Graphics & Animation Lab

面向熟悉游戏状态、但刚开始学习前端图形和动画的 JavaScript 交互教程。

## 模块

1. Mesh Grid：拖拽顶点，看 quad 如何拆成 triangles。
2. Deformation：通过正弦函数逐帧重算网格顶点。
3. Skeleton Skinning：观察两骨骼的矩阵与权重怎样混合顶点位置；可拖动末端做简化 IK。

## 运行

```bash
python3 -m http.server 8093 --directory graphics-animation-lab
```

打开 `http://localhost:8093`。

这套工具使用 Canvas 2D 故意把顶点和三角形画出来。迁移到 WebGL、Three.js 或 Godot 时，顶点属性、变换矩阵、蒙皮权重和渲染循环的基本数学保持一致，只是大量循环会在 GPU 上执行。
