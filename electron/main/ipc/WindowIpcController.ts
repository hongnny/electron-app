import { ipcMain, type BrowserWindow, type WebContents } from 'electron'
import { WINDOW_CHANNELS } from '../../../shared/ipc-channels'
import type { WindowService } from '../windows/WindowService'
import type { OpenWindowInput } from '../../../shared/window-contract'

// IPC 参数来自 renderer，必须在主进程做运行时校验，不能只依赖 TS 类型。
function validateInput(input: unknown): OpenWindowInput {
  if (
    !input ||
    typeof input !== 'object' ||
    !('kind' in input) ||
    (input.kind !== 'recorder' && input.kind !== 'preview')
  ) {
    throw new TypeError('Unsupported window kind')
  }
  return { kind: input.kind }
}

// 负责 renderer 到主进程的命令入口；窗口创建与复用交给服务处理。
export class WindowIpcController {
  constructor(
    private readonly dependencies: {
      windows: WindowService<BrowserWindow, WebContents>
      isTabSender(sender: WebContents): boolean
    }
  ) { }

  // 应用启动时注册一次全局 handler，关闭主窗口不会移除此入口。
  register(): void {
    ipcMain.handle(WINDOW_CHANNELS.open, (event, input: unknown) => {
      const { windows, isTabSender } = this.dependencies
      // 只接受受管理标签页或独立窗口的主 frame，拒绝其他页面和子 frame。
      if (
        event.senderFrame !== event.sender.mainFrame ||
        (!isTabSender(event.sender) && !windows.owns(event.sender))
      ) {
        throw new Error('Unsupported window sender')
      }
      // 校验参数后转交服务；结果或错误经 invoke 返回给调用页面。
      return windows.open(validateInput(input))
    })
  }

  // 应用退出时注销 handler，避免残留 IPC 注册。
  unregister(): void {
    ipcMain.removeHandler(WINDOW_CHANNELS.open)
  }
}
