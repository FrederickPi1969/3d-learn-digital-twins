# 虚拟操作系统与浏览器实现说明

## 浏览器能做到什么

当前浏览器应用是真实的网页容器，但不是 Chromium 内核的第二个进程。它使用当前页面中的 `iframe` 加载本地路径或外部 Hypertext Transfer Protocol Secure 地址，并在虚拟桌面中提供地址栏、历史、刷新、主页、书签和外部打开。

同源本地页面可以稳定运行，因此项目内置了 `/embedded/home.html`、`/embedded/collection.html` 和 `/embedded/guide.html`。这些页面随 Vite 和 Nginx 一起部署，不依赖网络。后续可将它们替换为 React 子路由、内部知识库、票务页面或数字资产管理页面。

外部页面是否能显示由目标网站决定。目标服务器可以通过以下响应头禁止被第三方页面嵌套：

```text
Content-Security-Policy: frame-ancestors 'none'
X-Frame-Options: DENY
X-Frame-Options: SAMEORIGIN
```

浏览器端代码不能合法绕过这些限制。需要嵌入企业内部系统时，应在该系统的服务器端把当前展厅域名加入允许的 `frame-ancestors`，并处理单点登录、Cookie 的 `SameSite` 属性和跨域资源共享策略。不能修改目标系统时，应使用“外部打开”，或者由自己的服务端提供经过授权的专用前端。

## 当前安全约束

iframe 使用：

```text
sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
```

该配置适用于演示环境，允许常见网页功能，但仍隔离顶层导航。生产项目需要根据目标页面删除不必要权限。尤其不要对不可信内容同时开放脚本和同源能力。外部地址建议使用域名白名单，禁止 `javascript:`、`data:` 和任意自定义协议。

当前地址归一化只允许站内绝对路径和 Hypertext Transfer Protocol / Hypertext Transfer Protocol Secure 地址。无法识别的输入会转换为搜索地址。示例实现使用 Google 搜索，但 Google 搜索结果页通常不允许 iframe 嵌套，因此生产环境应改成企业搜索服务或外部打开。

## 何时需要真正的浏览器内核

需要跨站登录、下载管理、开发者工具、浏览器扩展、完整标签页隔离或绕过普通网页嵌套限制时，仅靠 iframe 不够。可选架构如下：

```text
普通 Web 部署
React 虚拟桌面 ── iframe ── 允许嵌套的网页

桌面应用部署
Electron / Tauri 壳层 ── WebView ── 独立浏览器上下文

服务器远程浏览器
React 客户端 ── 视频流 / 远程控制 ── 服务端 Chromium
```

Electron 或 Tauri 适合固定展厅终端，但会把项目从纯静态网页变成桌面应用，需要自动更新、签名和终端运维。服务端远程浏览器成本更高，还涉及会话隔离、图像流延迟和凭证管理。当前 starter 选择 iframe，是因为它能够覆盖本地内容、企业允许嵌入页面和学习演示，同时保持 Docker 静态部署能力。

## 窗口系统

`react-rnd` 负责边界内拖动和八方向缩放。窗口状态包含应用标识、标题、位置、尺寸、层级、最小化和最大化。每次聚焦都会递增层级计数；已打开应用再次启动时不会创建重复窗口，而是恢复并置顶现有窗口。

窗口最大化使用父容器 100% 尺寸，最大化期间禁用拖动和缩放。任务栏保存所有已打开窗口，点击任务栏图标可以恢复最小化窗口。关闭虚拟系统后整个桌面树卸载，重新打开时创建新的访客会话。

## 增加应用

首先在 `src/types/exhibition.ts` 的 `ExhibitionAppId` 中增加标识。然后创建新的 React 应用组件，并在 `VirtualOSOverlay.tsx` 的 `APP_DEFINITIONS` 中声明标题、图标、说明、默认宽度和默认高度。最后在 `renderApplication` 中增加映射。

应用组件不应直接操作 Three.js 对象引用。需要联动三维场景时，通过 `useExhibitionStore` 发出语义动作，例如选择展品、请求镜头、调整灯光或切换建筑显隐。这样应用可以独立测试，也不会依赖 Three.js 组件是否已经挂载。
