import type { Tab } from './Tab'
import type { TabAppDefinition } from './TabAppRegistry'

export class TabSessionPolicy {
  partitionFor(tab: Tab, app: TabAppDefinition): string {
    if (app.sessionMode === 'persistent') return `persist:tab-${tab.id}`
    if (app.sessionMode === 'shared') return `persist:app-${app.id}`
    return `tab-${tab.id}`
  }
}
