import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import { createMainWindow } from './window/MainWindow'
import { TabStore } from './tabs/TabStore'
import { TabViewRegistry } from './tabs/TabViewRegistry'
import { TabAppRegistry } from './tabs/TabAppRegistry'
import { TabSessionPolicy } from './tabs/TabSessionPolicy'
import { ElectronTabViewHost } from './tabs/ElectronTabViewHost'
import { TabService } from './tabs/TabService'
import { TabLayoutController } from './tabs/TabLayoutController'
import { TabIpcController } from './ipc/TabIpcController'
import { WindowAppRegistry } from './windows/WindowAppRegistry'
import { WindowRegistry } from './windows/WindowRegistry'
import { WindowService } from './windows/WindowService'
import { ElectronWindowHost } from './windows/ElectronWindowHost'
import { WindowIpcController } from './ipc/WindowIpcController'

interface ApplicationContext {
  window: BrowserWindow
  tabs: TabService
  layout: TabLayoutController
  ipc: TabIpcController
  views: TabViewRegistry
}

let applicationContext: ApplicationContext | null = null
function createApplicationContext(apps: TabAppRegistry): ApplicationContext {
  const window = createMainWindow()
  const store = new TabStore()
  const views = new TabViewRegistry()
  const sessions = new TabSessionPolicy()
  const host = new ElectronTabViewHost({ window, sessions })
  const tabs = new TabService({ store, views, apps, host })
  const layout = new TabLayoutController({ window, views, tabs })
  const ipc = new TabIpcController({ window, tabs })

  layout.start()
  ipc.register()

  const shellDevUrl = process.env.ELECTRON_SHELL_URL
  if (shellDevUrl) {
    void window.loadURL(shellDevUrl)
  } else {
    void window.loadFile(
      path.join(__dirname, '..', '..', 'dist', 'apps', 'shell', 'index.html')
    )
  }

  window.webContents.once('did-finish-load', () => ipc.publish(tabs.snapshot()))
  tabs.create({ appId: 'home' })

  const context = { window, tabs, layout, ipc, views }
  window.on('closed', () => {
    layout.stop()
    ipc.unregister()
    tabs.dispose()
    if (applicationContext === context) applicationContext = null
  })

  return context
}

app.whenReady().then(() => {
  const apps = TabAppRegistry.createDefault({
    projectRoot: path.join(__dirname, '..', '..'),
    developmentUrls: { home: process.env.ELECTRON_APP_HOME_URL }
  })
  // 应用级注册独立页面：录音使用单独前端，预览复用首页前端。
  const windowApps = WindowAppRegistry.createDefault({
    projectRoot: path.join(__dirname, '..', '..'),
    developmentUrls: {
      recorder: process.env.ELECTRON_APP_RECORDER_URL,
      preview: process.env.ELECTRON_APP_HOME_URL
    }
  })
  // 窗口服务只装配一次，独立于主窗口的创建和关闭，保证应用内单例。
  const windows = new WindowService({
    apps: windowApps,
    registry: new WindowRegistry<BrowserWindow>(),
    host: new ElectronWindowHost()
  })
  // 注入当前标签页的来源判断；独立窗口的来源由窗口服务自行判断。
  const windowIpc = new WindowIpcController({
    windows,
    isTabSender: (sender) =>
      applicationContext?.views
        .values()
        .some((view) => view.webContents === sender) ?? false
  })
  // IPC 与应用同生命周期；主窗口关闭仅释放标签页相关对象。
  windowIpc.register()
  app.once('will-quit', () => windowIpc.unregister())
  applicationContext = createApplicationContext(apps)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      applicationContext = createApplicationContext(apps)
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
