import { useEffect, useState } from 'react'
import type { TabSnapshot } from '../../../shared/tab-contract'

const EMPTY_STATE: TabSnapshot = { tabs: [], activeTabId: null }

function CloseIcon() {
  return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8m0-8-8 8" /></svg>
}

function PlusIcon() {
  return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg>
}

export function App() {
  const [state, setState] = useState<TabSnapshot>(EMPTY_STATE)

  useEffect(() => {
    void window.desktopTabs.getSnapshot().then(setState)
    return window.desktopTabs.subscribe(setState)
  }, [])

  return (
    <header className="titlebar">
      <div className="traffic-light-space" />
      <div className="tabs" role="tablist" aria-label="应用标签">
        {state.tabs.map((tab) => {
          const isActive = tab.id === state.activeTabId
          return (
            <button
              className={`tab ${isActive ? 'active' : ''}`}
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => void window.desktopTabs.activate(tab.id)}
            >
              <span className={`tab-dot status-${tab.status}`} />
              <span className="tab-title">{tab.title}</span>
              <span
                className={`close-tab ${tab.closable ? '' : 'disabled'}`}
                role="button"
                aria-label={`关闭${tab.title}`}
                aria-disabled={!tab.closable}
                onClick={(event) => {
                  event.stopPropagation()
                  void window.desktopTabs.close(tab.id)
                }}
              >
                <CloseIcon />
              </span>
            </button>
          )
        })}

        <button
          className="add-tab"
          type="button"
          aria-label="新建首页"
          onClick={() => void window.desktopTabs.create({ appId: 'home' })}
        >
          <PlusIcon />
        </button>
      </div>
    </header>
  )
}
