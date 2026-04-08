export type ToastType = 'error' | 'success' | 'warning' | 'info'

let _callback: ((msg: string, type: ToastType) => void) | null = null

export function _registerToastCallback(cb: (msg: string, type: ToastType) => void) {
  _callback = cb
}

export const toast = {
  error:   (msg: string) => _callback?.(msg, 'error'),
  success: (msg: string) => _callback?.(msg, 'success'),
  warning: (msg: string) => _callback?.(msg, 'warning'),
  info:    (msg: string) => _callback?.(msg, 'info'),
}
