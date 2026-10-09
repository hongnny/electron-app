import { contextBridge, ipcRenderer } from 'electron'
import { WINDOW_CHANNELS } from '../../shared/ipc-channels'
import type { DesktopWindowsApi, TabRuntimeInfo } from '../../shared/window-contract'

contextBridge.exposeInMainWorld('tabRuntime', {
  rendererPid: process.pid,
  platform: process.platform,
} satisfies TabRuntimeInfo)

contextBridge.exposeInMainWorld('desktopWindows', {
  openHome: (): Promise<void> => ipcRenderer.invoke(WINDOW_CHANNELS.openHome),
} satisfies DesktopWindowsApi)
