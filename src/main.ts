import { Plugin } from 'obsidian'
import { SettingTab } from './SettingTab'
import { delegateIpcRendererSend } from './delegate'
import type { DataConfig } from './type'

class PluginProxy extends Plugin {
  async onload() {
    this.addSettingTab(new SettingTab(this.app, this))
    const config: DataConfig = await this.loadData()
    this.syncConfig(config)
  }

  syncConfig(config: DataConfig) {
    const proxyItem = config.proxyList.find(p => p.id === config.currentProxy)

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    delegateIpcRendererSend(proxyItem!, this.app.vault.adapter.ipcRenderer)
  }

  async saveData(config: DataConfig) {
    await super.saveData(config)
    this.syncConfig(config)
  }
}

export default PluginProxy
