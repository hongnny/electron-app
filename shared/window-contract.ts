export interface DesktopWindowsApi {
  openHome(): Promise<void>
}

export interface TabRuntimeInfo {
  rendererPid: number
  platform: string
}
