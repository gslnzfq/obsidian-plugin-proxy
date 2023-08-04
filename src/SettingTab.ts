import type { App, Plugin, TextAreaComponent } from 'obsidian'
import { Notice, PluginSettingTab, Setting } from 'obsidian'
import type { DataConfig, DataConfigProxyItem } from './type'

export class SettingTab extends PluginSettingTab {
  plugin: Plugin

  constructor(app: App, plugin: Plugin) {
    super(app, plugin)
    this.plugin = plugin
  }

  async saveData(config?: DataConfig) {
    config = config || await this.plugin.loadData()
    await this.plugin.saveData(config)
  }

  async showResetNotice() {
    return new Notice('代理服务器已切换，请重启Obsidian或者点击菜单 View -> Force Reload 后使用三方插件市场和三方主题市场')
  }

  async display() {
    const { containerEl: cont } = this
    let inputTextArea: TextAreaComponent

    cont.empty()
    cont.createEl('h2', { text: 'Plugin Proxy Setting' })
    cont.createEl('br')

    new Setting(cont)
      .setName('代理服务器')
      .setDesc('通过选择不同的服务器来切换代理，可以解决某些情况下，某个服务器无法访问的情况。')
      .addDropdown(async (dropDown) => {
        const config: DataConfig = await this.plugin.loadData()
        config.proxyList.forEach((item: DataConfigProxyItem) => {
          dropDown.addOption(item.id, item.id)
        })

        dropDown.setValue(config.currentProxy)

        // set dropdown value
        dropDown.onChange(async (value) => {
          config.currentProxy = value
          await this.saveData(config)
          return this.showResetNotice()
        })
      })

    new Setting(cont).setName('自定义代理服务器')
      .setDesc('自定义代理服务器，格式为JSON，包含id、userImages、raw、page字段。')
      .addTextArea(async (textArea) => {
        inputTextArea = textArea
        textArea.inputEl.style.height = '120px'
        textArea.inputEl.style.width = '100%'
        textArea.inputEl.style.display = 'block'
        textArea.inputEl.style.marginTop = '10px'
        textArea.setValue(JSON.stringify({
          id: '',
          raw: '',
          page: '',
          userImages: '',
        }, null, '  '))
      })
      .addButton((button) => {
        button.setButtonText('保存')
        button.onClick(async () => {
          try {
            const config: DataConfig = await this.plugin.loadData()
            const value = JSON.parse(inputTextArea.getValue())
            for (const key of ['id', 'userImages', 'raw', 'page']) {
              if (!value[key]) {
                return new Notice(`缺少${key}字段`)
              }
            }

            // 查看id是否存在
            const index = config.proxyList.findIndex(p => p.id === value.id)
            if (index === -1) {
              config.proxyList.unshift(value)
            }
            else {
              return new Notice(`id为${value.id}的代理已存在`)
            }

            await this.saveData(config)
            await this.display()
          }
          catch (error) {
            return new Notice('JSON格式错误')
          }
        })
      })
      .settingEl
      .setAttr('style', 'display: block;')

    const config: DataConfig = await this.plugin.loadData()
    config.proxyList.forEach((item: DataConfigProxyItem) => {
      const setting = new Setting(cont).setName(item.id)
      // 内置的代理不允许删除，且只有一个代理时不允许删除
      setting.addButton((button) => {
        button.setButtonText('删除')
        button.onClick(async () => {
          if (config.proxyList.length === 1) {
            return new Notice('至少保留一个代理')
          }
          config.proxyList = config.proxyList.filter(p => p.id !== item.id)
          const firstItem = config.proxyList[0]
          // 如果默认代理是当前代理，那么重置为默认代理
          if (config.defaultProxy === item.id) {
            config.defaultProxy = firstItem.id
          }

          // 如果删除了是当前使用的代理，那么重置为默认代理
          if (config.currentProxy === item.id) {
            config.currentProxy = firstItem.id
            await this.showResetNotice()
          }
          await this.saveData(config)
          await this.display()
        })
      })
      cont.createEl('div', { text: `userImages: ${item.userImages || '-'}` })
      cont.createEl('div', { text: `raw: ${item.raw}` })
      cont.createEl('div', {
        text: `page: ${item.page}`,
        attr: { style: 'margin-bottom: 20px;' },
      })
    })
  }
}
