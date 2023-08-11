'use strict';

const obsidian = require('obsidian');
const electron = require('electron');

class SettingTab extends obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  async saveData(config) {
    config = config || await this.plugin.loadData();
    await this.plugin.saveData(config);
  }
  async showResetNotice() {
    return new obsidian.Notice(
      "\u4EE3\u7406\u670D\u52A1\u5668\u5DF2\u5207\u6362\uFF0C\u8BF7\u91CD\u542FObsidian\u6216\u8005\u70B9\u51FB\u83DC\u5355 View -> Force Reload \u540E\u4F7F\u7528\u4E09\u65B9\u63D2\u4EF6\u5E02\u573A\u548C\u4E09\u65B9\u4E3B\u9898\u5E02\u573A"
    );
  }
  async display() {
    const { containerEl: cont } = this;
    let inputTextArea;
    cont.empty();
    cont.createEl("h2", { text: "Plugin Proxy Setting" });
    cont.createEl("br");
    new obsidian.Setting(cont).setName("\u4EE3\u7406\u670D\u52A1\u5668").setDesc(
      "\u901A\u8FC7\u9009\u62E9\u4E0D\u540C\u7684\u670D\u52A1\u5668\u6765\u5207\u6362\u4EE3\u7406\uFF0C\u53EF\u4EE5\u89E3\u51B3\u67D0\u4E9B\u60C5\u51B5\u4E0B\uFF0C\u67D0\u4E2A\u670D\u52A1\u5668\u65E0\u6CD5\u8BBF\u95EE\u7684\u60C5\u51B5\u3002"
    ).addDropdown(async (dropDown) => {
      const config2 = await this.plugin.loadData();
      config2.proxyList.forEach((item) => {
        dropDown.addOption(item.id, item.id);
      });
      dropDown.setValue(config2.currentProxy);
      dropDown.onChange(async (value) => {
        config2.currentProxy = value;
        await this.saveData(config2);
        return this.showResetNotice();
      });
    });
    new obsidian.Setting(cont).setName("\u81EA\u5B9A\u4E49\u4EE3\u7406\u670D\u52A1\u5668").setDesc(
      "\u81EA\u5B9A\u4E49\u4EE3\u7406\u670D\u52A1\u5668\uFF0C\u683C\u5F0F\u4E3AJSON\uFF0C\u5305\u542Bid\u3001userImages\u3001raw\u3001page\u5B57\u6BB5\u3002"
    ).addTextArea(async (textArea) => {
      inputTextArea = textArea;
      textArea.inputEl.style.height = "120px";
      textArea.inputEl.style.width = "100%";
      textArea.inputEl.style.display = "block";
      textArea.inputEl.style.marginTop = "10px";
      textArea.setValue(
        JSON.stringify(
          {
            id: "",
            raw: "",
            page: "",
            userImages: ""
          },
          null,
          "  "
        )
      );
    }).addButton((button) => {
      button.setButtonText("\u4FDD\u5B58");
      button.onClick(async () => {
        try {
          const config2 = await this.plugin.loadData();
          const value = JSON.parse(inputTextArea.getValue());
          for (const key of ["id", "userImages", "raw", "page"]) {
            if (!value[key]) {
              return new obsidian.Notice(`\u7F3A\u5C11${key}\u5B57\u6BB5`);
            }
          }
          const index = config2.proxyList.findIndex((p) => p.id === value.id);
          if (index === -1) {
            config2.proxyList.unshift(value);
          } else {
            return new obsidian.Notice(`id\u4E3A${value.id}\u7684\u4EE3\u7406\u5DF2\u5B58\u5728`);
          }
          await this.saveData(config2);
          await this.display();
        } catch (error) {
          return new obsidian.Notice("JSON\u683C\u5F0F\u9519\u8BEF");
        }
      });
    }).settingEl.setAttr("style", "display: block;");
    const config = await this.plugin.loadData();
    config.proxyList.forEach((item) => {
      const setting = new obsidian.Setting(cont).setName(item.id);
      setting.addButton((button) => {
        button.setButtonText("\u5220\u9664");
        button.onClick(async () => {
          if (config.proxyList.length === 1) {
            return new obsidian.Notice("\u81F3\u5C11\u4FDD\u7559\u4E00\u4E2A\u4EE3\u7406");
          }
          config.proxyList = config.proxyList.filter((p) => p.id !== item.id);
          const firstItem = config.proxyList[0];
          if (config.defaultProxy === item.id) {
            config.defaultProxy = firstItem.id;
          }
          if (config.currentProxy === item.id) {
            config.currentProxy = firstItem.id;
            await this.showResetNotice();
          }
          await this.saveData(config);
          await this.display();
        });
      });
      cont.createEl("div", { text: `userImages: ${item.userImages || "-"}` });
      cont.createEl("div", { text: `raw: ${item.raw}` });
      cont.createEl("div", {
        text: `page: ${item.page}`,
        attr: { style: "margin-bottom: 20px;" }
      });
    });
  }
}

var ProxyRequestType = /* @__PURE__ */ ((ProxyRequestType2) => {
  ProxyRequestType2[ProxyRequestType2["Unknown"] = 0] = "Unknown";
  ProxyRequestType2["Raw"] = "raw";
  ProxyRequestType2["Page"] = "page";
  ProxyRequestType2["UserImage"] = "userImages";
  return ProxyRequestType2;
})(ProxyRequestType || {});
const proxyRequestMatchRegex = [
  ["raw" /* Raw */, /^https?:\/\/raw.githubusercontent.com\//],
  ["page" /* Page */, /^https?:\/\/github.com\//],
  [
    "userImages" /* UserImage */,
    /^https?:\/\/user-images.githubusercontent.com\//
  ]
];
const proxyRequestReplaceHostMap = /* @__PURE__ */ new Map([
  ["raw" /* Raw */, "https://raw.githubusercontent.com/"],
  ["page" /* Page */, "https://github.com/"],
  ["userImages" /* UserImage */, "https://user-images.githubusercontent.com/"]
]);
var IpcRendererSendType = /* @__PURE__ */ ((IpcRendererSendType2) => {
  IpcRendererSendType2["requestUrl"] = "request-url";
  IpcRendererSendType2["remoteBrowserDereference"] = "REMOTE_BROWSER_DEREFERENCE";
  return IpcRendererSendType2;
})(IpcRendererSendType || {});

function matchUrl(e) {
  let type = ProxyRequestType.Unknown;
  if (!e || typeof e.url !== "string") {
    return type;
  }
  proxyRequestMatchRegex.some(([tp, regExp]) => {
    const matched = regExp.test(e.url);
    if (matched) {
      type = tp;
    }
    return matched;
  });
  return type;
}
function handleUrl(url, config) {
  if (!url.startsWith("http")) {
    return url;
  }
  const requestType = matchUrl({ url });
  if (config[requestType] && proxyRequestReplaceHostMap.has(requestType)) {
    return url.replace(
      proxyRequestReplaceHostMap.get(requestType),
      config[requestType]
    );
  }
  return url;
}
function delegateIpcRendererSend(config, ipcRenderer) {
  const ipcRendererSend = ipcRenderer.send;
  electron.remote.session.defaultSession.webRequest.onBeforeRequest(
    {
      urls: [
        "https://raw.githubusercontent.com/*/*",
        "https://user-images.githubusercontent.com/*/*",
        "https://github.com/*/*"
      ]
    },
    (details, callback) => {
      details.url = handleUrl(details.url, config);
      callback({
        cancel: false,
        redirectURL: details.url
      });
    }
  );
  ipcRenderer.send = function(...args) {
    const [type, _, req, ...other] = args;
    if (type === IpcRendererSendType.requestUrl) {
      const requestType = matchUrl(req);
      if (requestType !== ProxyRequestType.Unknown) {
        req.url = handleUrl(req.url, config);
        if (!req.headers) {
          req.headers = {};
        }
        req.headers["content-type"] = "application/x-www-form-urlencoded";
        req.headers["Access-Control-Allow-Origin"] = "*";
      }
    }
    ipcRendererSend.bind(ipcRenderer)(type, _, req, ...other);
  };
}

class PluginProxy extends obsidian.Plugin {
  async onload() {
    this.addSettingTab(new SettingTab(this.app, this));
    const config = await this.loadData();
    this.syncConfig(config);
  }
  syncConfig(config) {
    const proxyItem = config.proxyList.find((p) => p.id === config.currentProxy);
    delegateIpcRendererSend(proxyItem, this.app.vault.adapter.ipcRenderer);
  }
  async saveData(config) {
    await super.saveData(config);
    this.syncConfig(config);
  }
}

module.exports = PluginProxy;
