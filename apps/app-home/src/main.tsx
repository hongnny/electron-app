import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import type { WindowKind } from '../../../shared/window-contract'

// 首页既可作为标签页，也可作为多实例预览页，通过 URL 参数区分标题。
const tabId = new URLSearchParams(location.search).get('tabId') ?? '?'
const isStandalone = new URLSearchParams(location.search).get('windowKind') === 'preview'
const title = isStandalone ? '独立窗口' : `首页 ${tabId}`
document.title = title

function HomeApp() {
  const [count, setCount] = useState(0)
  const [error, setError] = useState('')
  // 页面只发出打开意图，单例复用、窗口配置和生命周期由主进程负责。
  async function openWindow(kind: WindowKind) {
    setError('')
    try {
      await window.desktopWindows?.open({ kind })
    } catch {
      setError('打开窗口失败，请重试。')
    }
  }
  return (
    <main className="page home">
      <section className="card">
        <span className="badge">APP HOME</span>
        <h1>{title}</h1>
        <p>这是 Home Vite 项目的独立运行实例。</p>
        <button onClick={() => setCount((value) => value + 1)}>独立计数：{count}</button>
        {/* 普通浏览器没有 preload 接口，因此禁用窗口入口。 */}
        <button disabled={!window.desktopWindows} onClick={() => void openWindow('recorder')}>打开实时录音</button>
        <button disabled={!window.desktopWindows} onClick={() => void openWindow('preview')}>打开独立预览</button>
        {error && <p role="alert">{error}</p>}
        <small>Renderer PID: {window.tabRuntime?.rendererPid ?? 'browser'}</small>
      </section>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><HomeApp /></StrictMode>)
