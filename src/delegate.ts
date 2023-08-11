import type { DataConfigProxyItem } from './type'
import {
  IpcRendererSendType,
  ProxyRequestType,
  proxyRequestMatchRegex,
  proxyRequestReplaceHostMap,
} from './type'

// @ts-ignore
import { remote } from 'electron'

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

function handleUrl(url: string, config: any) {
  if (!url.startsWith('http')) {
    return url
  }
  const requestType = matchUrl({ url })
  // 判断是否配置了代理
  if (config[requestType] && proxyRequestReplaceHostMap.has(requestType)) {
    return url.replace(
      proxyRequestReplaceHostMap.get(requestType)!,
      config[requestType],
    )
  }
  return url
}

export function delegateIpcRendererSend(
  config: DataConfigProxyItem,
  ipcRenderer: any,
) {
  const ipcRendererSend = ipcRenderer.send
  // 处理主题请求图片
  remote.session.defaultSession.webRequest.onBeforeRequest(
    {
      urls: [
        'https://raw.githubusercontent.com/*/*',
        'https://user-images.githubusercontent.com/*/*',
        'https://github.com/*/*',
      ],
    },
    (details: any, callback: (resp: any) => void) => {
      details.url = handleUrl(details.url, config)
      callback({
        cancel: false,
        redirectURL: details.url,
      })
    },
  )

  // @ts-ignore
  ipcRenderer.send = function (...args) {
    const [type, _, req, ...other] = args
    if (type === IpcRendererSendType.requestUrl) {
      const requestType = matchUrl(req)
      if (requestType !== ProxyRequestType.Unknown) {
        req.url = handleUrl(req.url, config)
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
