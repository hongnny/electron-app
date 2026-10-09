import { ipcMain, type WebContents } from 'electron'
import { WINDOW_CHANNELS } from '../../../shared/ipc-channels'
import type { StandaloneWindowService } from '../window/StandaloneWindowService'

export class WindowIpcController {
  constructor(private readonly dependencies: {
    windows: StandaloneWindowService
    isTabSender(sender: WebContents): boolean
  }) { }

  register(): void {
    ipcMain.handle(WINDOW_CHANNELS.openHome, (event) => {
      const { windows, isTabSender } = this.dependencies
      if (event.senderFrame !== event.sender.mainFrame || (!isTabSender(event.sender) && !windows.owns(event.sender))) {
        throw new Error('Unsupported window sender')
      }
      return windows.openHome()
    })
  }

  unregister(): void {
    ipcMain.removeHandler(WINDOW_CHANNELS.openHome)
  }
}
