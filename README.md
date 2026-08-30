# Electron Multi-tab Workspace

一个基于 Electron `WebContentsView`、TypeScript、Vite 和 React 的多应用标签客户端。

## 目录架构

```text
electron-multi-tab-demo/
├── apps/
│   ├── shell/                         # 顶部标签栏 React 项目
│   ├── app-home/                      # 首页 Vite React 项目
│   ├── app-settings/                  # 设置 Vite React 项目
│   └── app-workspace/                 # 工作台 Vite React 项目
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

## 开发

```bash
npm install
npm run dev
```

开发端口：

- Shell：5173
- Home：5174
- Settings：5175
- Workspace：5176

## 验证

```bash
npm run typecheck
npm test
npm run build
npm start
```
