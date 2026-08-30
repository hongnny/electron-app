import test from 'node:test'
import assert from 'node:assert/strict'
import { TabStore } from '../electron/main/tabs/TabStore'

test('TabStore only exposes serializable tab data', () => {
  const store = new TabStore()
  const tab = store.create({ appId: 'home', title: '首页' })
  store.setActive(tab.id)
  store.setStatus(tab.id, 'ready')

  assert.deepEqual(store.snapshot(), {
    tabs: [{ id: 1, appId: 'home', title: '首页', status: 'ready', closable: false }],
    activeTabId: 1,
  })
  assert.equal('view' in store.snapshot().tabs[0], false)
})

test('TabStore returns copies instead of mutable internal objects', () => {
  const store = new TabStore()
  const tab = store.create({ appId: 'home', title: '首页' })
  tab.title = '被外部修改'
  assert.equal(store.get(tab.id)?.title, '首页')
})
