import { WebContentsView, type BrowserWindow } from 'electron'
import type { Tab } from './Tab'
import type { TabAppDefinition } from './TabAppRegistry'
import type { TabSessionPolicy } from './TabSessionPolicy'

export interface TabViewHost<TView = WebContentsView> {
  createView(tab: Tab, app: TabAppDefinition): TView
  attach(view: TView): void
  show(view: TView): void
  hide(view: TView): void
  focus(view: TView): void
  load(view: TView, app: TabAppDefinition, params: Record<string, string>): Promise<void>
  destroy(view: TView): void
}

export class ElectronTabViewHost implements TabViewHost {
  constructor(
    private readonly dependencies: { window: BrowserWindow; sessions: TabSessionPolicy },
  ) { }

  createView(tab: Tab, app: TabAppDefinition): WebContentsView {
    const view = new WebContentsView({
      webPreferences: {
        preload: app.preload,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        partition: this.dependencies.sessions.partitionFor(tab, app),
      },
    })
    view.setBackgroundColor('#111318')
    view.setVisible(false)
    return view
  }

  attach(view: WebContentsView): void {
    this.dependencies.window.contentView.addChildView(view)
  }

  show(view: WebContentsView): void {
    view.setVisible(true)
  }

  hide(view: WebContentsView): void {
    view.setVisible(false)
  }

  focus(view: WebContentsView): void {
    view.webContents.focus()
  }

  async load(
    view: WebContentsView,
    app: TabAppDefinition,
    params: Record<string, string>,
  ): Promise<void> {
    if (app.devUrl) {
      const url = new URL(app.devUrl)
      for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
      await view.webContents.loadURL(url.toString())
      return
    }
    await view.webContents.loadFile(app.productionEntry, { query: params })
  }

  destroy(view: WebContentsView): void {
    const { window } = this.dependencies
    if (!window.isDestroyed()) window.contentView.removeChildView(view)
    if (!view.webContents.isDestroyed()) view.webContents.close({ waitForBeforeUnload: false })
  }
}
