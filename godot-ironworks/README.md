# Ironworks Outpost

一个以 Factorio 生产链为灵感、用于跑通 Godot 4 到 WebAssembly 导出的 2D 原型。

## 可玩循环

- `WASD` / 方向键移动角色。
- 靠近矿脉按 `E` 手工采矿。
- `1` 到 `4` 选择设施，鼠标左键建造。
- 自动采矿机必须覆盖矿脉，会持续产出原矿。
- 石炉自动把铁矿或铜矿与煤炭冶炼成金属板。
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
