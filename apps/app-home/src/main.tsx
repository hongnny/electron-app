import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const tabId = new URLSearchParams(location.search).get('tabId') ?? '?'
const isStandalone = new URLSearchParams(location.search).get('standalone') === '1'
const title = isStandalone ? '独立窗口' : `首页 ${tabId}`
document.title = title

function HomeApp() {
  const [count, setCount] = useState(0)
  const [error, setError] = useState('')
  async function openWindow() {
    setError('')
    try {
      await window.desktopWindows?.openHome()
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
        <button disabled={!window.desktopWindows} onClick={() => void openWindow()}>打开独立窗口</button>
        {error && <p role="alert">{error}</p>}
        <small>Renderer PID: {window.tabRuntime?.rendererPid ?? 'browser'}</small>
      </section>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><HomeApp /></StrictMode>)
