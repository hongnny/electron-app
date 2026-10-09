// 前后端共用的窗口类型；新增页面时需同步页面注册和 IPC 参数校验。
export type WindowKind = 'recorder' | 'preview'
// singleton：应用内同类型唯一；multiple：每次打开创建新的实例。
export type WindowInstancePolicy = 'singleton' | 'multiple'

// 页面只传窗口类型，页面地址和实例策略由主进程决定。
export interface OpenWindowInput { kind: WindowKind }
// 返回实际实例 ID，以及本次是否复用了已有或创建中的窗口。
export interface OpenWindowResult { instanceId: number; reused: boolean }
// preload 暴露给页面的窗口命令接口。
export interface DesktopWindowsApi {
  open(input: OpenWindowInput): Promise<OpenWindowResult>
}
// 页面可读取的运行环境信息，与窗口命令分开。
export interface TabRuntimeInfo { rendererPid: number; platform: string }
