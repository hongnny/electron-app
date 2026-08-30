import { EventEmitter } from 'node:events'
import type { WebContentsView } from 'electron'
import type { CreateTabInput, TabSnapshot } from './Tab'
import type { TabStore } from './TabStore'
import type { TabViewRegistryLike } from './TabViewRegistry'
import type { TabAppRegistry } from './TabAppRegistry'
import type { TabViewHost } from './ElectronTabViewHost'

export class TabService extends EventEmitter {
  constructor(
    private readonly dependencies: {
      store: TabStore
      views: TabViewRegistryLike
      apps: TabAppRegistry
      host: TabViewHost
    },
  ) {
    super()
  }

  snapshot(): TabSnapshot {
    return this.dependencies.store.snapshot()
  }

  create(input: CreateTabInput): TabSnapshot {
    const { store, views, apps, host } = this.dependencies
    const app = apps.get(input.appId)
    const tab = store.create({ appId: input.appId, title: app.title })
    const view = host.createView(tab, app)

    views.set(tab.id, view)
    host.attach(view)
    this.watchRenderer(tab.id, view)
    store.setStatus(tab.id, 'loading')
    this.activate(tab.id)

    void host.load(view, app, { tabId: String(tab.id), appId: tab.appId }).catch(() => {
      store.setStatus(tab.id, 'failed')
      this.publish()
    })

    return this.snapshot()
  }

  activate(id: number): TabSnapshot {
    const { store, views, host } = this.dependencies
    if (!store.setActive(id)) return this.snapshot()

    for (const [tabId, view] of views.entries()) {
      if (tabId === id) host.show(view)
      else host.hide(view)
    }

    const activeView = views.get(id)
    if (activeView) host.focus(activeView)
    this.publish()
    return this.snapshot()
  }

  close(id: number): TabSnapshot {
    const { store, views, host } = this.dependencies
    if (store.size <= 1) return this.snapshot()

    const closingIndex = store.indexOf(id)
    if (closingIndex === -1) return this.snapshot()

    const wasActive = store.activeTabId === id
    const view = views.delete(id)
    store.remove(id)
    if (view) host.destroy(view)

    if (wasActive) {
      const remaining = store.getAll()
      const fallback = remaining[Math.min(closingIndex, remaining.length - 1)]
      return this.activate(fallback.id)
    }

    this.publish()
    return this.snapshot()
  }

  dispose(): void {
    const { store, views, host } = this.dependencies
    for (const view of views.values()) host.destroy(view)
    views.clear()
    store.clear()
    this.removeAllListeners()
  }

  private watchRenderer(tabId: number, view: WebContentsView): void {
    const { store } = this.dependencies
    view.webContents.on('did-finish-load', () => {
      store.setStatus(tabId, 'ready')
      this.publish()
    })
    view.webContents.on('did-fail-load', (_event, _code, _description, _url, isMainFrame) => {
      if (!isMainFrame) return
      store.setStatus(tabId, 'failed')
      this.publish()
    })
    view.webContents.on('render-process-gone', () => {
      store.setStatus(tabId, 'crashed')
      this.publish()
    })
    view.webContents.on('page-title-updated', (event, title) => {
      event.preventDefault()
      store.setTitle(tabId, title)
      this.publish()
    })
  }

  private publish(): void {
    this.emit('changed', this.snapshot())
  }
}
