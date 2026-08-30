export type TabStatus = 'creating' | 'loading' | 'ready' | 'failed' | 'crashed'

export type TabAppId = 'home' | 'settings' | 'workspace'

export interface Tab {
  id: number
  appId: TabAppId
  title: string
  status: TabStatus
  createdAt: number
  lastActiveAt: number | null
}

export interface TabDto {
  id: number
  appId: TabAppId
  title: string
  status: TabStatus
  closable: boolean
}

export interface TabSnapshot {
  tabs: TabDto[]
  activeTabId: number | null
}

export interface CreateTabInput {
  appId: TabAppId
}

export interface DesktopTabsApi {
  getSnapshot(): Promise<TabSnapshot>
  create(input: CreateTabInput): Promise<TabSnapshot>
  activate(id: number): Promise<TabSnapshot>
  close(id: number): Promise<TabSnapshot>
  subscribe(listener: (snapshot: TabSnapshot) => void): () => void
}
