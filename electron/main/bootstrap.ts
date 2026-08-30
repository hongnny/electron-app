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

interface ApplicationContext {
  window: BrowserWindow
  tabs: TabService
  layout: TabLayoutController
  ipc: TabIpcController
}

let applicationContext: ApplicationContext | null = null

function createApplicationContext(): ApplicationContext {
  const window = createMainWindow()
  const store = new TabStore()
  const views = new TabViewRegistry()
  const apps = TabAppRegistry.createDefault({
    projectRoot: path.join(__dirname, '..', '..'),
    developmentUrls: {
      home: process.env.ELECTRON_APP_HOME_URL
    },
  })
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
    void window.loadFile(path.join(__dirname, '..', '..', 'dist', 'apps', 'shell', 'index.html'))
  }

  window.webContents.once('did-finish-load', () => ipc.publish(tabs.snapshot()))
  tabs.create({ appId: 'home' })

  const context = { window, tabs, layout, ipc }
  window.on('closed', () => {
    layout.stop()
    ipc.unregister()
    tabs.dispose()
    if (applicationContext === context) applicationContext = null
  })

  return context
}

app.whenReady().then(() => {
  applicationContext = createApplicationContext()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      applicationContext = createApplicationContext()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
