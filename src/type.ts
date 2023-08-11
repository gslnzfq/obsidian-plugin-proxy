export enum ProxyRequestType {
  Unknown,
  Raw = 'raw',
  Page = 'page',
  UserImage = 'userImages',
}

export const proxyRequestMatchRegex: [ProxyRequestType, RegExp][] = [
  [ProxyRequestType.Raw, /^https?:\/\/raw.githubusercontent.com\//],
  [ProxyRequestType.Page, /^https?:\/\/github.com\//],
  [
    ProxyRequestType.UserImage,
    /^https?:\/\/user-images.githubusercontent.com\//,
  ],
]

export const proxyRequestReplaceHostMap: Map<ProxyRequestType, string> =
  new Map([
    [ProxyRequestType.Raw, 'https://raw.githubusercontent.com/'],
    [ProxyRequestType.Page, 'https://github.com/'],
    [ProxyRequestType.UserImage, 'https://user-images.githubusercontent.com/'],
  ])

export interface DataConfigProxyItem {
  id: string
  raw: string
  page: string
  userImages: string
}

export interface DataConfig {
  currentProxy: string
  defaultProxy: string
  proxyList: DataConfigProxyItem[]
  customProxyEnable: boolean
  currentCustomProxy: string
  customProxyList: DataConfigProxyItem[]
}

export enum IpcRendererSendType {
  requestUrl = 'request-url',
  remoteBrowserDereference = 'REMOTE_BROWSER_DEREFERENCE',
}
