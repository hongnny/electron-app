import type { DesktopWindowsApi, TabRuntimeInfo } from '../../../shared/window-contract'

declare global {
  interface Window {
    tabRuntime?: TabRuntimeInfo
    desktopWindows?: DesktopWindowsApi
  }
}
