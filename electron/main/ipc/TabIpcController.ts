import { ipcMain, type BrowserWindow } from 'electron'
import { TAB_CHANNELS } from '../../../shared/ipc-channels'
import type { CreateTabInput, TabAppId, TabSnapshot } from '../../../shared/tab-contract'
import type { TabService } from '../tabs/TabService'

const APP_IDS = new Set<TabAppId>(['home', 'settings', 'workspace'])

function validateCreateInput(input: unknown): CreateTabInput {
  if (!input || typeof input !== 'object' || !('appId' in input)) {
    throw new TypeError('create tab requires an appId')
  }
  const appId = (input as { appId: unknown }).appId
  if (typeof appId !== 'string' || !APP_IDS.has(appId as TabAppId)) {
    throw new TypeError(`unsupported tab app: ${String(appId)}`)
  }
  return { appId: appId as TabAppId }
}

export class TabIpcController {
  private readonly onChanged = (snapshot: TabSnapshot) => this.publish(snapshot)

  constructor(
    private readonly dependencies: { window: BrowserWindow; tabs: TabService },
  ) {}

  register(): void {
    const { tabs } = this.dependencies
    ipcMain.handle(TAB_CHANNELS.getSnapshot, () => tabs.snapshot())
    ipcMain.handle(TAB_CHANNELS.create, (_event, input) => tabs.create(validateCreateInput(input)))
    ipcMain.handle(TAB_CHANNELS.activate, (_event, id: number) => tabs.activate(id))
    ipcMain.handle(TAB_CHANNELS.close, (_event, id: number) => tabs.close(id))
    tabs.on('changed', this.onChanged)
  }

  unregister(): void {
    ipcMain.removeHandler(TAB_CHANNELS.getSnapshot)
    ipcMain.removeHandler(TAB_CHANNELS.create)
    ipcMain.removeHandler(TAB_CHANNELS.activate)
    ipcMain.removeHandler(TAB_CHANNELS.close)
    this.dependencies.tabs.removeListener('changed', this.onChanged)
  }

  publish(snapshot: TabSnapshot): void {
    const { window } = this.dependencies
    if (!window.isDestroyed() && !window.webContents.isDestroyed()) {
      window.webContents.send(TAB_CHANNELS.changed, snapshot)
    }
  }
}
