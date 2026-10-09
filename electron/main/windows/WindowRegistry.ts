import type { WindowKind } from '../../../shared/window-contract'

// 一条运行中的窗口记录：实例 ID 用于区分同类型的多个窗口。
export interface WindowInstance<TWindow> {
  id: number
  kind: WindowKind
  window: TWindow
}

// 保存实际窗口引用；创建、关闭与单例策略由 WindowService 编排。
export class WindowRegistry<TWindow> {
  private readonly instances = new Map<number, WindowInstance<TWindow>>()
  // 创建后登记实例，使 IPC 来源校验和单例查找能找到它。
  set(instance: WindowInstance<TWindow>): void {
    this.instances.set(instance.id, instance)
  }
  // 窗口关闭或加载失败后删除记录，释放窗口引用。
  delete(id: number): void {
    this.instances.delete(id)
  }
  // 单例策略使用此方法查找已有的同类型窗口。
  find(kind: WindowKind): WindowInstance<TWindow> | undefined {
    return this.values().find((instance) => instance.kind === kind)
  }
  // 返回实例列表的副本，用于遍历已登记窗口。
  values(): WindowInstance<TWindow>[] {
    return [...this.instances.values()]
  }
}
