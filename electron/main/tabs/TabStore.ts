import type { Tab, TabAppId, TabSnapshot, TabStatus } from './Tab'

export class TabStore {
  readonly #tabs: Tab[] = []
  #activeTabId: number | null = null
  #nextId = 1

  create(input: { appId: TabAppId; title: string }): Tab {
    const tab: Tab = {
      id: this.#nextId++,
      appId: input.appId,
      title: input.title,
      status: 'creating',
      createdAt: Date.now(),
      lastActiveAt: null,
    }
    this.#tabs.push(tab)
    return { ...tab }
  }

  get(id: number): Tab | undefined {
    const tab = this.#tabs.find((item) => item.id === id)
    return tab ? { ...tab } : undefined
  }

  getAll(): Tab[] {
    return this.#tabs.map((tab) => ({ ...tab }))
  }

  get size(): number {
    return this.#tabs.length
  }

  get activeTabId(): number | null {
    return this.#activeTabId
  }

  indexOf(id: number): number {
    return this.#tabs.findIndex((tab) => tab.id === id)
  }

  setActive(id: number): boolean {
    const tab = this.#tabs.find((item) => item.id === id)
    if (!tab) return false
    this.#activeTabId = id
    tab.lastActiveAt = Date.now()
    return true
  }

  setStatus(id: number, status: TabStatus): boolean {
    const tab = this.#tabs.find((item) => item.id === id)
    if (!tab) return false
    tab.status = status
    return true
  }

  setTitle(id: number, title: string): boolean {
    const tab = this.#tabs.find((item) => item.id === id)
    if (!tab || !title) return false
    tab.title = title
    return true
  }

  remove(id: number): { tab: Tab; index: number } | undefined {
    const index = this.indexOf(id)
    if (index === -1) return undefined
    const [removed] = this.#tabs.splice(index, 1)
    if (this.#activeTabId === id) this.#activeTabId = null
    return { tab: { ...removed }, index }
  }

  snapshot(): TabSnapshot {
    return {
      tabs: this.#tabs.map(({ id, appId, title, status }) => ({
        id,
        appId,
        title,
        status,
        closable: this.#tabs.length > 1,
      })),
      activeTabId: this.#activeTabId,
    }
  }

  clear(): void {
    this.#tabs.splice(0)
    this.#activeTabId = null
  }
}
