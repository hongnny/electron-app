import type { WebContentsView } from 'electron'

export interface TabViewRegistryLike<TView = WebContentsView> {
  set(tabId: number, view: TView): void
  get(tabId: number): TView | undefined
  delete(tabId: number): TView | undefined
  entries(): Array<[number, TView]>
  values(): TView[]
  clear(): void
}

export class TabViewRegistry implements TabViewRegistryLike {
  readonly #views = new Map<number, WebContentsView>()

  set(tabId: number, view: WebContentsView): void {
    if (this.#views.has(tabId)) throw new Error(`View already exists for tab ${tabId}`)
    this.#views.set(tabId, view)
  }

  get(tabId: number): WebContentsView | undefined {
    return this.#views.get(tabId)
  }

  delete(tabId: number): WebContentsView | undefined {
    const view = this.#views.get(tabId)
    this.#views.delete(tabId)
    return view
  }

  entries(): Array<[number, WebContentsView]> {
    return [...this.#views.entries()]
  }

  values(): WebContentsView[] {
    return [...this.#views.values()]
  }

  clear(): void {
    this.#views.clear()
  }
}
