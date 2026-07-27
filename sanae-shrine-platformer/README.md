# 守矢山道 · 横版试炼

单关制的东风谷早苗主题 Web 横版动作原型。当前版本使用原生 HTML、CSS 和 JavaScript，通过固定 60 Hz 循环驱动移动、跳跃、碰撞与镜头。

## 运行

```bash
cd sanae-shrine-platformer
python3 -m http.server 8091
```

访问 `http://localhost:8091`。

## 操作

- `A / D` 或 `← / →`：行走
- `W / Space / ↑`：跳跃
- `Esc`：暂停 / 继续
- 从野怪上方落下：踩怪并弹跳

使用用户提供的原始素材包；其中角色与野怪帧经透明背景整理后放在 `assets/processed/`，原始包保留在 `assets/sanae-shrine-platformer-assets/`。

当前已知待调项：跳跃高度仍然偏低。
