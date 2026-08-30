import path from 'node:path'
import type { TabAppId } from './Tab'

export type TabSessionMode = 'isolated' | 'shared' | 'persistent'

export interface TabAppDefinition {
  id: TabAppId
  title: string
  devUrl?: string
  productionEntry: string
  preload: string
  sessionMode: TabSessionMode
}

interface DefaultRegistryOptions {
  projectRoot: string
  developmentUrls: Partial<Record<TabAppId, string>>
}

export class TabAppRegistry {
  readonly #apps = new Map<TabAppId, Readonly<TabAppDefinition>>()

  register(definition: TabAppDefinition): this {
    if (this.#apps.has(definition.id)) throw new Error(`Tab app already registered: ${definition.id}`)
    this.#apps.set(definition.id, Object.freeze({ ...definition }))
    return this
  }

  get(appId: TabAppId): Readonly<TabAppDefinition> {
    const app = this.#apps.get(appId)
    if (!app) throw new Error(`Unknown tab app: ${appId}`)
    return app
  }

  static createDefault(options: DefaultRegistryOptions): TabAppRegistry {
    const preload = path.join(options.projectRoot, 'dist-electron', 'preload', 'tab-preload.js')
    const app = (id: TabAppId, title: string): TabAppDefinition => ({
      id,
      title,
      devUrl: options.developmentUrls[id],
      productionEntry: path.join(options.projectRoot, 'dist', 'apps', `app-${id}`, 'index.html'),
      preload,
      sessionMode: 'isolated',
    })

    return new TabAppRegistry()
      .register(app('home', '首页'))
  }
}
