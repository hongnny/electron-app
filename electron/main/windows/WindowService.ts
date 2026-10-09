import type { OpenWindowInput, OpenWindowResult, WindowKind } from '../../../shared/window-contract'
import type { WindowAppDefinition, WindowAppRegistry } from './WindowAppRegistry'
import type { WindowRegistry } from './WindowRegistry'

// 窗口平台操作接口：服务通过它操作窗口，测试可使用假的窗口实现。
export interface WindowHost<TWindow, TSender> {
  create(definition: Readonly<WindowAppDefinition>, id: number): TWindow
  load(window: TWindow, definition: Readonly<WindowAppDefinition>, id: number): Promise<void>
  focus(window: TWindow): void
  destroy(window: TWindow): void
  isDestroyed(window: TWindow): boolean
  onClosed(window: TWindow, callback: () => void): void
  owns(window: TWindow, sender: TSender): boolean
}

// 编排窗口生命周期和实例策略，不直接调用 Electron API。
export class WindowService<TWindow, TSender> {
  // 应用运行期间递增的实例 ID，单例重开也会得到新的 ID。
  private sequence = 1
  // 按窗口类型记录尚未完成的单例创建任务。
  private readonly pending = new Map<WindowKind, Promise<OpenWindowResult>>()

  // apps 提供配置，registry 保存实例，host 执行平台操作。
  constructor(private readonly dependencies: {
    apps: WindowAppRegistry
    registry: WindowRegistry<TWindow>
    host: WindowHost<TWindow, TSender>
  }) { }

  // 判断 IPC 发送方是否属于本服务管理的独立窗口。
  owns(sender: TSender): boolean {
    return this.dependencies.registry.values().some(({ window }) => this.dependencies.host.owns(window, sender))
  }

  // 统一打开入口：先取得页面定义，再按单例或多实例策略处理。
  async open(input: OpenWindowInput): Promise<OpenWindowResult> {
    const { apps, registry, host } = this.dependencies
    console.log('==>>>inpit', input.kind)
    const definition = apps.get(input.kind)
    if (definition.instancePolicy === 'singleton') {
      // 同类型窗口正在创建时，等待同一次创建，避免快速连点生成多个实例。
      const pending = this.pending.get(input.kind)
      if (pending) return { ...await pending, reused: true }

      // 已有窗口直接恢复并聚焦，不重新加载页面，保留当前业务状态。
      const existing = registry.find(input.kind)
      console.log('WindowService.ts 47 existing', existing);
      if (existing && !host.isDestroyed(existing.window)) {
        host.focus(existing.window)
        return { instanceId: existing.id, reused: true }
      }
      // 移除已销毁窗口的残留记录，允许重新创建。
      if (existing) registry.delete(existing.id)

      // 保存创建中的 Promise，让后续同类型请求复用这次创建。
      const opening = this.create(definition)
      this.pending.set(input.kind, opening)
      // 无论创建成功还是失败，都清除等待记录；失败后可以再次尝试打开。
      try { return await opening } finally { this.pending.delete(input.kind) }
    }
    // 多实例不查询已有窗口，每个打开请求都创建新实例。
    return this.create(definition)
  }

  // 单例和多实例共用的创建流程；页面加载成功后才显示窗口。
  private async create(definition: Readonly<WindowAppDefinition>): Promise<OpenWindowResult> {
    const { registry, host } = this.dependencies
    // 先创建并登记窗口，再绑定关闭清理；隐藏加载期间也可校验来源。
    const id = this.sequence++
    const window = host.create(definition, id)
    registry.set({ id, kind: definition.kind, window })
    host.onClosed(window, () => registry.delete(id))
    try {
      // 加载独立前端，并防止加载期间已关闭的窗口被再次显示。
      await host.load(window, definition, id)
      if (host.isDestroyed(window)) throw new Error('Window closed while loading')
      host.focus(window)
      return { instanceId: id, reused: false }
    } catch (error) {
      // 加载失败清理记录和实际窗口，将错误传回页面以便提示和重试。
      registry.delete(id)
      if (!host.isDestroyed(window)) host.destroy(window)
      throw error
    }
  }
}
