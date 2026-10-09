import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

// 独立的录音前端入口；单例由主进程保证，React 不维护全局窗口状态。
// 当前仅提供页面骨架，后续音频采集和录音状态在录音业务模块中实现。
function RecorderApp() {
  return <main className="page"><section className="card">
    <span className="badge">实时录音</span>
    <h1>准备录音</h1>
    <p>录音页面已就绪，录音能力待接入。</p>
    <div className="timer">00:00:00</div>
    <p>再次打开实时录音，会回到这个窗口。</p>
  </section></main>
}

createRoot(document.getElementById('root')!).render(<StrictMode><RecorderApp /></StrictMode>)
