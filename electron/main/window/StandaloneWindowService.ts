import { BrowserWindow, type WebContents } from 'electron'
import type { TabAppRegistry } from '../tabs/TabAppRegistry'

export class StandaloneWindowService {
  private readonly windows = new Set<BrowserWindow>()
  private sequence = 1

  constructor(private readonly dependencies: { apps: TabAppRegistry }) {}

  owns(sender: WebContents): boolean {
    return [...this.windows].some((window) => window.webContents === sender)
  }

  async openHome(): Promise<void> {
    const definition = this.dependencies.apps.get('home')
    const window = new BrowserWindow({
      width: 960,
      height: 680,
      minWidth: 480,
      minHeight: 360,
      title: '独立窗口',
      backgroundColor: '#101319',
      show: false,
      webPreferences: {
        preload: definition.preload,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        partition: `standalone:${this.sequence++}`,
      },
    })
    this.windows.add(window)
    window.on('closed', () => this.windows.delete(window))
    try {
      if (definition.devUrl) {
        const url = new URL(definition.devUrl)
        url.searchParams.set('standalone', '1')
        await window.loadURL(url.toString())
      } else {
        await window.loadFile(definition.productionEntry, { query: { standalone: '1' } })
      }
      if (!window.isDestroyed()) window.show()
    } catch (error) {
      if (!window.isDestroyed()) window.destroy()
      throw error
    }
  }
}
