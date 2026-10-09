# Electron Multi-tab Workspace

一个基于 Electron `WebContentsView`、TypeScript、Vite 和 React 的多应用标签客户端。

## 目录架构

```text
electron-multi-tab-demo/
├── apps/
│   ├── shell/                         # 顶部标签栏 React 项目
│   ├── app-home/                      # 首页 Vite React 项目
│   └── app-recorder/                  # 全局单例录音窗口前端
│
├── electron/
│   ├── main/
│   │   ├── bootstrap.ts               # Electron 启动与依赖装配
│   │   ├── window/MainWindow.ts       # BrowserWindow 创建
│   │   ├── tabs/
│   │   │   ├── Tab.ts
│   │   │   ├── TabStore.ts
│   │   │   ├── TabService.ts
│   │   │   ├── TabViewRegistry.ts
│   │   │   ├── TabAppRegistry.ts
│   │   │   ├── TabLayoutController.ts
│   │   │   ├── TabSessionPolicy.ts
│   │   │   └── ElectronTabViewHost.ts
│   │   └── ipc/TabIpcController.ts
│   └── preload/
│       ├── shell-preload.ts
│       └── tab-preload.ts
│
├── shared/
│   ├── tab-contract.ts
│   └── ipc-channels.ts
├── test/
└── package.json
```

## 核心边界

- `TabStore` 只保存可序列化领域数据。
- `TabViewRegistry` 单独维护 `tabId -> WebContentsView`。
- `TabService` 编排创建、激活、关闭和 renderer 生命周期。
- `TabAppRegistry` 注册不同 Vite 应用入口。
- `TabSessionPolicy` 决定标签的浏览器 session 隔离方式。
- `ElectronTabViewHost` 是业务层与 Electron API 的适配层。
- Shell 只消费 `TabSnapshot` 并发送命令。

## 独立窗口

- `WindowAppRegistry` 注册页面入口、窗口尺寸以及 `singleton` / `multiple` 实例策略。
- `WindowRegistry` 保存实际窗口实例；`WindowService` 处理创建、单例复用、并发打开和失败清理。
- `ElectronWindowHost` 负责 Electron 窗口创建、页面加载、恢复和聚焦。
- `WindowIpcController` 校验调用来源和打开参数，preload 暴露共享 `DesktopWindowsApi`。
- 首页通过 `desktopWindows.open({ kind: 'recorder' })` 打开录音页。重复打开恢复并聚焦原窗口，不重新加载页面；关闭后可以重开。
- `preview` 使用 `multiple` 策略，每次打开独立的首页预览实例。
- 窗口服务在应用级装配，生命周期独立于主窗口。新增类型时更新共享契约、页面注册和 IPC 参数校验。

录音前端目前提供页面骨架，尚未接入音频采集与保存。

## 开发

```bash
npm install
npm run dev
```

开发端口：

- Shell：5173
- Home：5174
- Recorder：5175

## 验证

```bash
npm run typecheck
npm test
npm run build
npm start
```
