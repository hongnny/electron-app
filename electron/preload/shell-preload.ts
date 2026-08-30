import { contextBridge, ipcRenderer } from 'electron'
import { TAB_CHANNELS } from '../../shared/ipc-channels'
import type { CreateTabInput, DesktopTabsApi, TabSnapshot } from '../../shared/tab-contract'

const api: DesktopTabsApi = {
  getSnapshot: () => ipcRenderer.invoke(TAB_CHANNELS.getSnapshot),
  create: (input: CreateTabInput) => ipcRenderer.invoke(TAB_CHANNELS.create, input),
  activate: (id: number) => ipcRenderer.invoke(TAB_CHANNELS.activate, id),
  close: (id: number) => ipcRenderer.invoke(TAB_CHANNELS.close, id),
  subscribe: (listener: (snapshot: TabSnapshot) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, snapshot: TabSnapshot) => listener(snapshot)
    ipcRenderer.on(TAB_CHANNELS.changed, handler)
    return () => ipcRenderer.removeListener(TAB_CHANNELS.changed, handler)
  },
}

contextBridge.exposeInMainWorld('desktopTabs', api)
