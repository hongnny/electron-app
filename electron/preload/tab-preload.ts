import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('tabRuntime', {
  rendererPid: process.pid,
  platform: process.platform,
})
