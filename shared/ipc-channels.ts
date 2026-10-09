export const TAB_CHANNELS = {
  getSnapshot: 'tabs:get-snapshot',
  create: 'tabs:create',
  activate: 'tabs:activate',
  close: 'tabs:close',
  changed: 'tabs:changed',
} as const

export const WINDOW_CHANNELS = {
  openHome: 'windows:open-home',
} as const
