import test from 'node:test'
import assert from 'node:assert/strict'
import { TabStore } from '../electron/main/tabs/TabStore'
import { TabViewRegistry, type TabViewRegistryLike } from '../electron/main/tabs/TabViewRegistry'
import { TabAppRegistry } from '../electron/main/tabs/TabAppRegistry'
import { TabService } from '../electron/main/tabs/TabService'
import type { TabViewHost } from '../electron/main/tabs/ElectronTabViewHost'

class FakeWebContents {
  readonly listeners = new Map<string, (...args: unknown[]) => void>()
  destroyed = false
  on(event: string, callback: (...args: never[]) => void): void {
    this.listeners.set(event, callback as (...args: unknown[]) => void)
  }
  isDestroyed(): boolean { return this.destroyed }
}

interface FakeView {
  visible: boolean
  webContents: FakeWebContents
}

class FakeRegistry implements TabViewRegistryLike<FakeView> {
  readonly views = new Map<number, FakeView>()
  set(id: number, view: FakeView): void { this.views.set(id, view) }
  get(id: number): FakeView | undefined { return this.views.get(id) }
  delete(id: number): FakeView | undefined { const view = this.views.get(id); this.views.delete(id); return view }
  entries(): Array<[number, FakeView]> { return [...this.views.entries()] }
  values(): FakeView[] { return [...this.views.values()] }
  clear(): void { this.views.clear() }
}

class FakeHost {
  readonly destroyed: FakeView[] = []
  createView(): FakeView { return { visible: false, webContents: new FakeWebContents() } }
  attach(): void {}
  show(view: FakeView): void { view.visible = true }
  hide(view: FakeView): void { view.visible = false }
  focus(): void {}
  load(): Promise<void> { return Promise.resolve() }
  destroy(view: FakeView): void { view.webContents.destroyed = true; this.destroyed.push(view) }
}

function createService() {
  const store = new TabStore()
  const views = new FakeRegistry()
  const host = new FakeHost()
  const apps = new TabAppRegistry().register({
    id: 'home', title: '首页', productionEntry: '', preload: '', sessionMode: 'isolated',
  })
  const service = new TabService({
    store,
    views: views as unknown as TabViewRegistry,
    apps,
    host: host as unknown as TabViewHost,
  })
  return { service, views, host }
}

test('each tab owns a separate view and activation only changes visibility', () => {
  const { service, views } = createService()
  service.create({ appId: 'home' })
  service.create({ appId: 'home' })
  assert.notEqual(views.get(1), views.get(2))
  assert.equal(views.get(1)?.visible, false)
  assert.equal(views.get(2)?.visible, true)
  service.activate(1)
  assert.equal(views.get(1)?.visible, true)
  assert.equal(views.get(2)?.visible, false)
})

test('closing destroys its view but never closes the final tab', () => {
  const { service, host } = createService()
  service.create({ appId: 'home' })
  service.create({ appId: 'home' })
  service.close(2)
  assert.equal(service.snapshot().tabs.length, 1)
  assert.equal(host.destroyed.length, 1)
  service.close(1)
  assert.equal(service.snapshot().tabs.length, 1)
  assert.equal(host.destroyed.length, 1)
})
