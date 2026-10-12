import { app, dialog, Menu, type MenuItemConstructorOptions } from 'electron'
import { autoUpdater } from 'electron-updater'

// 更新属于主进程：页面不能直接下载或启动安装器。
// 示例用原生菜单观察阶段，避免为学习更新机制额外引入一套 IPC。
export class UpdateService {
  private busy = false
  private downloaded = false
  private status = '尚未检查'

  start(): void {
    // 手动下载、手动安装，让每个阶段都能单独观察。
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = false
    autoUpdater.logger = console
    autoUpdater.on('checking-for-update', () => this.setStatus('正在检查'))
    autoUpdater.on('update-available', (info) => this.setStatus(`发现新版 ${info.version}`))
    autoUpdater.on('update-not-available', () => this.setStatus('已经是最新版本'))
    autoUpdater.on('download-progress', (info) => this.setStatus(`下载中 ${info.percent.toFixed(1)}%`))
    autoUpdater.on('update-downloaded', (info) => {
      this.downloaded = true
      this.setStatus(`${info.version} 已下载并通过文件完整性校验，等待安装`)
    })
    // 更新器也会发出 error 事件，必须监听，避免未处理事件导致异常退出。
    autoUpdater.on('error', (error) => this.setStatus(`更新失败：${error.message}`))
    this.renderMenu()
  }

  private setStatus(status: string): void {
    this.status = status
    console.log(`[更新示例 ${app.getVersion()}] ${status}`)
    this.renderMenu()
  }

  private renderMenu(): void {
    const template: MenuItemConstructorOptions[] = []
    if (process.platform === 'darwin') template.push({ role: 'appMenu' })
    template.push(
      { role: 'fileMenu' }, { role: 'editMenu' }, { role: 'viewMenu' }, { role: 'windowMenu' },
      {
        label: '整包升级示例',
        submenu: [
          { label: `当前客户端：${app.getVersion()}`, enabled: false },
          { label: this.status, enabled: false },
          { type: 'separator' },
          {
            label: '1. 检查并选择下载',
            enabled: !this.busy && !this.downloaded,
            click: () => { void this.checkAndDownload() }
          },
          {
            label: '2. 重启并安装',
            enabled: this.downloaded && !this.busy,
            click: () => { void this.install() }
          }
        ]
      }
    )
    Menu.setApplicationMenu(Menu.buildFromTemplate(template))
  }

  private async checkAndDownload(): Promise<void> {
    if (this.busy || this.downloaded) return
    if (!app.isPackaged) {
      await dialog.showMessageBox({ message: '请运行打包后的应用', detail: 'npm run dev / npm start 使用开发 Electron，不能证明安装包升级。' })
      return
    }
    this.busy = true
    this.renderMenu()
    try {
      // 更新地址来自打包生成的 resources/app-update.yml。
      // checkForUpdates 返回的 isUpdateAvailable 避免自行实现版本比较。
      const result = await autoUpdater.checkForUpdates()
      if (!result?.isUpdateAvailable) return
      const { response } = await dialog.showMessageBox({
        type: 'info', message: `发现 ${result.updateInfo.version}，当前 ${app.getVersion()}`,
        detail: '检查只读取版本信息；点击下载后才传输更新文件。',
        buttons: ['下载', '稍后'], cancelId: 1
      })
      if (response === 0) await autoUpdater.downloadUpdate()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.setStatus(`更新失败：${message}`)
      await dialog.showMessageBox({ type: 'error', message: '更新未完成', detail: message })
    } finally {
      this.busy = false
      this.renderMenu()
    }
  }

  private async install(): Promise<void> {
    if (!this.downloaded || this.busy) return
    const { response } = await dialog.showMessageBox({
      message: '退出应用并安装新版本？', detail: '请先保存工作。安装完成后重新启动，菜单版本应变为 1.0.1。',
      buttons: ['重启安装', '取消'], cancelId: 1
    })
    // macOS 在手动安装模式下，这里才触发 Squirrel 原生准备与签名验证。
    // 安装器接管替换文件；不是在当前进程里替换已执行的 JS。
    if (response === 0) autoUpdater.quitAndInstall()
  }
}
