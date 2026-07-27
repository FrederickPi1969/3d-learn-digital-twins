# Ironworks Outpost

一个以 Factorio 生产链为灵感、用于跑通 Godot 4 到 WebAssembly 导出的 2D 原型。

界面包含中文，因此项目随导出包附带开源 Noto Sans CJK SC 字体及其 OFL 许可；不能依赖浏览器或操作系统是否安装中文字体。

## 可玩循环

- `WASD` / 方向键移动角色。
- 靠近矿脉按 `E` 手工采矿。
- 按 `G` 消耗两块铁板合成一个齿轮。
- `1` 到 `4` 选择设施，鼠标左键建造。
- 点击已经建成的采矿机、石炉或传送带，打开该设施的库存面板；按 `Esc` 关闭。
- 自动采矿机必须覆盖矿脉，会持续把原矿写进自己的内部缓存；在面板内取出。
- 石炉有独立输入和输出格：在面板中放入铁矿/铜矿和煤炭，冶炼后取出金属板。
- 传送带也有独立货物缓存，可从面板投入或取回货物，同时显示移动特效。
- 鼠标右键点击已有设施可拆除，并返还建造材料和内部库存；矿脉会保留。
- 按 `G` 用两块铁板手工合成一个齿轮。
- 建造研究站需要 8 铁板和 5 铜板，是本关的完成目标。

## Godot 编辑器运行

```bash
godot --editor --path godot-ironworks
```

## WebAssembly 导出

```bash
godot --headless --path godot-ironworks --export-release Web build/web/ironworks.html
python3 -m http.server 8092 --directory godot-ironworks/build/web
```

打开 `http://localhost:8092/ironworks.html`。不能直接双击 HTML 文件，因为浏览器会阻止 WebAssembly 运行时通过 `file://` 读取导出资源。
