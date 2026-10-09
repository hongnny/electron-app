import { BrowserWindow, type WebContents } from 'electron'
import type { WindowAppDefinition } from './WindowAppRegistry'
import type { WindowHost } from './WindowService'

// 将 WindowHost 接口转换成实际的 Electron BrowserWindow 操作。
export class ElectronWindowHost implements WindowHost<
  BrowserWindow,
  WebContents
> {
  // 初始隐藏以避免空白闪烁；每个实例使用独立的内存 session。
  create(definition: Readonly<WindowAppDefinition>, id: number): BrowserWindow {
    return new BrowserWindow({
      width: definition.width,
      height: definition.height,
      minWidth: 480,
      minHeight: 360,
      title: definition.title,
      backgroundColor: '#101319',
      show: false,
      webPreferences: {
        preload: definition.preload,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        partition: `window:${id}`
      }
    })
  }
  // 开发加载 Vite 地址，生产加载构建文件；查询参数标识窗口实例和类型。
  async load(
    window: BrowserWindow,
    definition: Readonly<WindowAppDefinition>,
    id: number
  ): Promise<void> {
    const query = { windowId: String(id), windowKind: definition.kind }
    if (definition.devUrl) {
      const url = new URL(definition.devUrl)
      for (const [key, value] of Object.entries(query))
        url.searchParams.set(key, value)
      await window.loadURL(url.toString())
    } else {
      await window.loadFile(definition.productionEntry, { query })
    }
  }
  // 复用窗口时恢复最小化状态并置前，不重新加载页面。
  focus(window: BrowserWindow): void {
    if (window.isMinimized()) window.restore()
    window.show()
    window.focus()
  }
  // 创建失败时立即销毁窗口，防止留下不可用的隐藏窗口。
  destroy(window: BrowserWindow): void {
    window.destroy()
  }
  // 服务在复用、显示和错误清理前检查窗口是否仍有效。
  isDestroyed(window: BrowserWindow): boolean {
    return window.isDestroyed()
  }
  // 仅在实际关闭后触发一次清理；窗口隐藏或最小化不删除记录。
  onClosed(window: BrowserWindow, callback: () => void): void {
    window.once('closed', callback)
  }
  // 将 IPC 的 WebContents 发送方与实际窗口对应起来。
  owns(window: BrowserWindow, sender: WebContents): boolean {
    return !window.isDestroyed() && window.webContents === sender
  }
}
