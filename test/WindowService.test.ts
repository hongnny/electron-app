import { test } from 'node:test'
import assert from 'node:assert/strict'
import { WindowAppRegistry } from '../electron/main/windows/WindowAppRegistry'
import { WindowRegistry } from '../electron/main/windows/WindowRegistry'
import { WindowService, type WindowHost } from '../electron/main/windows/WindowService'

type FakeWindow = { destroyed: boolean; focusCount: number; closed?: () => void }
function setup(load: () => Promise<void> = async () => {}) {
  const created: FakeWindow[] = []
  const host: WindowHost<FakeWindow, FakeWindow> = {
    create: () => { const window = { destroyed: false, focusCount: 0 }; created.push(window); return window },
    load,
    focus: (window) => { window.focusCount++ },
    destroy: (window) => { window.destroyed = true; window.closed?.() },
    isDestroyed: (window) => window.destroyed,
    onClosed: (window, callback) => { window.closed = callback },
    owns: (window, sender) => window === sender,
  }
  const registry = new WindowRegistry<FakeWindow>()
  const apps = WindowAppRegistry.createDefault({ projectRoot: '/project', developmentUrls: {} })
  return { service: new WindowService({ apps, registry, host }), created, host, registry }
}

test('concurrent singleton opens share creation and later opens focus without reload', async () => {
  let finish!: () => void
  const { service, created } = setup(() => new Promise<void>((resolve) => { finish = resolve }))
  const first = service.open({ kind: 'recorder' })
  const second = service.open({ kind: 'recorder' })
  assert.equal(created.length, 1)
  finish()
  const [a, b] = await Promise.all([first, second])
  assert.equal(a.instanceId, b.instanceId)
  assert.equal(b.reused, true)
  const third = await service.open({ kind: 'recorder' })
  assert.equal(third.reused, true)
  assert.equal(created.length, 1)
  assert.equal(created[0].focusCount, 2)
})

test('multiple windows create distinct instances', async () => {
  const { service, created } = setup()
  const [a, b] = await Promise.all([service.open({ kind: 'preview' }), service.open({ kind: 'preview' })])
  assert.notEqual(a.instanceId, b.instanceId)
  assert.equal(created.length, 2)
})

test('closing singleton removes ownership and allows reopening', async () => {
  const { service, created, host } = setup()
  const a = await service.open({ kind: 'recorder' })
  assert.equal(service.owns(created[0]), true)
  host.destroy(created[0])
  assert.equal(service.owns(created[0]), false)
  const b = await service.open({ kind: 'recorder' })
  assert.notEqual(a.instanceId, b.instanceId)
})

test('failed load clears pending singleton and destroys instance before retry', async () => {
  let attempts = 0
  const { service, created, registry } = setup(async () => { if (++attempts === 1) throw new Error('load failed') })
  await assert.rejects(service.open({ kind: 'recorder' }), /load failed/)
  assert.equal(created[0].destroyed, true)
  assert.equal(registry.values().length, 0)
  const retry = await service.open({ kind: 'recorder' })
  assert.equal(retry.reused, false)
  assert.equal(registry.values().length, 1)
})
