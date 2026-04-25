import { app } from 'electron'

export function setAutoStart(enable: boolean, silent?: boolean): { success: boolean; error?: string } {
  try {
    const args: string[] = []
    if (enable && silent) {
      args.push('--hidden')
    }
    app.setLoginItemSettings({
      openAtLogin: enable,
      args
    })
    console.log(`[AutoStart] ${enable ? 'enabled' : 'disabled'}${silent ? ' (silent mode)' : ''}`)
    return { success: true }
  } catch (error) {
    console.error('[AutoStart] Failed to set auto-start:', error)
    return { success: false, error: (error as Error).message }
  }
}

export function getAutoStartStatus(): boolean {
  const settings = app.getLoginItemSettings()
  return settings.openAtLogin
}

export function isSilentStartup(): boolean {
  return process.argv.includes('--hidden')
}
