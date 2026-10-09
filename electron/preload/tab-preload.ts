import { contextBridge, ipcRenderer } from 'electron'
import { WINDOW_CHANNELS } from '../../shared/ipc-channels'
import type {
  DesktopWindowsApi,
  OpenWindowInput,
  OpenWindowResult,
  TabRuntimeInfo
} from '../../shared/window-contract'

// 通过隔离桥提供只读运行信息，不向页面暴露 Node 或 Electron 对象。
contextBridge.exposeInMainWorld('tabRuntime', {
  rendererPid: process.pid,
  platform: process.platform
} satisfies TabRuntimeInfo)

// 页面调用 open 后，invoke 将请求送到主进程并等待结果或错误。
// 标签页和独立页面都复用此 preload，因此都能使用统一窗口接口。
contextBridge.exposeInMainWorld('desktopWindows', {
  open: (input: OpenWindowInput): Promise<OpenWindowResult> =>
    ipcRenderer.invoke(WINDOW_CHANNELS.open, input)
} satisfies DesktopWindowsApi)
