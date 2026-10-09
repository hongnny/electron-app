import path from 'node:path'
import type {
  WindowKind,
  WindowInstancePolicy
} from '../../../shared/window-contract'

// 一个窗口类型的静态配置：页面入口、实例策略、preload 和初始尺寸。
export interface WindowAppDefinition {
  kind: WindowKind
  instancePolicy: WindowInstancePolicy
  title: string
  devUrl?: string
  productionEntry: string
  preload: string
  width: number
  height: number
}

// 保存窗口类型的定义；这里只登记配置，不保存或创建实际窗口。
export class WindowAppRegistry {
  private readonly definitions = new Map<
    WindowKind,
    Readonly<WindowAppDefinition>
  >()

  // 同一类型只能注册一次；冻结配置，避免运行中被修改。
  register(definition: WindowAppDefinition): this {
    if (this.definitions.has(definition.kind))
      throw new Error(`Window already registered: ${definition.kind}`)
    this.definitions.set(definition.kind, Object.freeze({ ...definition }))
    return this
  }

  // 打开窗口时按类型取得定义，未注册的类型直接报错。
  get(kind: WindowKind): Readonly<WindowAppDefinition> {
    const definition = this.definitions.get(kind)
    if (!definition) throw new Error(`Unknown window: ${kind}`)
    return definition
  }

  // 将前端应用与窗口类型关联，统一配置开发 URL 和生产构建入口。
  static createDefault(options: {
    projectRoot: string
    developmentUrls: Partial<Record<WindowKind, string>>
  }): WindowAppRegistry {
    const definition = (
      kind: WindowKind,
      app: string,
      title: string,
      instancePolicy: WindowInstancePolicy
    ): WindowAppDefinition => ({
      kind,
      title,
      instancePolicy,
      devUrl: options.developmentUrls[kind],
      productionEntry: path.join(
        options.projectRoot,
        'dist',
        'apps',
        app,
        'index.html'
      ),
      preload: path.join(
        options.projectRoot,
        'dist-electron',
        'preload',
        'tab-preload.js'
      ),
      width: 960,
      height: 680
    })
    // 录音在整个应用内只保留一个窗口；预览允许多个独立实例。
    return new WindowAppRegistry()
      .register(definition('recorder', 'app-recorder', '实时录音', 'singleton'))
      .register(definition('preview', 'app-home', '独立预览', 'multiple'))
  }
}
