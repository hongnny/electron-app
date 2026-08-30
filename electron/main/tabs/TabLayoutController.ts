import type { BrowserWindow } from 'electron'
import type { TabViewRegistry } from './TabViewRegistry'
import type { TabService } from './TabService'

export class TabLayoutController {
  private readonly tabBarHeight: number

  constructor(
    private readonly dependencies: {
      window: BrowserWindow
      views: TabViewRegistry
      tabs: TabService
      tabBarHeight?: number
    },
  ) {
    this.tabBarHeight = dependencies.tabBarHeight ?? 58
    this.layout = this.layout.bind(this)
  }

  start(): void {
    this.dependencies.window.on('resize', this.layout)
    this.dependencies.tabs.on('changed', this.layout)
  }

  stop(): void {
    this.dependencies.window.removeListener('resize', this.layout)
    this.dependencies.tabs.removeListener('changed', this.layout)
  }

  layout(): void {
    const { window, views } = this.dependencies
    if (window.isDestroyed()) return
    const [width, height] = window.getContentSize()
    const bounds = {
      x: 0,
      y: this.tabBarHeight,
      width,
      height: Math.max(0, height - this.tabBarHeight),
    }
    for (const view of views.values()) view.setBounds(bounds)
  }
}
