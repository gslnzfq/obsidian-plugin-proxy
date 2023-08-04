import type { DataConfigProxyItem } from './type'
import { IpcRendererSendType, ProxyRequestType, proxyRequestMatchRegex, proxyRequestReplaceHostMap } from './type'

function matchUrl(e?: any) {
  let type = ProxyRequestType.Unknown
  if (!e || typeof e.url !== 'string') {
    return type
  }

  proxyRequestMatchRegex.some(([tp, regExp]) => {
    const matched = regExp.test(e.url)
    if (matched) {
      type = tp
    }
    return matched
  })

  return type
}

export function delegateIpcRendererSend(config: DataConfigProxyItem, ipcRenderer: any) {
  const ipcRendererSend = ipcRenderer.send

  ipcRenderer.send = function (...args) {
    const [type, _, req, ...other] = args
    if (type === IpcRendererSendType.requestUrl) {
      const requestType = matchUrl(req)
      if (requestType !== ProxyRequestType.Unknown) {
        // 判断是否配置了代理
        if (config[requestType]) {
          req.url = req.url.replace(proxyRequestReplaceHostMap.get(requestType), config[requestType])
        }
        if (!req.headers) {
          req.headers = {}
        }
        req.headers['content-type'] = 'application/x-www-form-urlencoded'
        req.headers['Access-Control-Allow-Origin'] = '*'
      }
    }

    ipcRendererSend.bind(ipcRenderer)(type, _, req, ...other)
  }
}
