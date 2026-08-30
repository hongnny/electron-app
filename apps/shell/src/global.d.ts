import type { DesktopTabsApi } from '../../../shared/tab-contract'

declare global {
  interface Window {
    desktopTabs: DesktopTabsApi
  }
}

export {}
