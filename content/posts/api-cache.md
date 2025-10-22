---
title: "App 接口缓存策略"
date: 2025-10-22 11:23:29 +0800
draft: false
---

## 目标

降低后端服务压力，减少重复请求，还能通过使用本地缓存数据来提升页面加载速度。

## 缓存策略

App 使用原生缓存机制（URLCache），可支持强缓存和协商缓存（ETag / Last-Modified）。由于协商缓存仍会触发请求到后端，可节省流量，但对减轻服务器压力作用有限，因此先只做强缓存。

### 强缓存（Strong Cache）

服务端在 API 返回的 Header 中添加 `Cache-Control: max-age=60`

- App 在 60 秒内对该 API 不再请求后端，直接使用本地缓存。（API 可根据情况分别设置max-age或者 no-cache）

- 缓存过期后再次请求时才访问后端服务。

- 仅缓存 GET 类型接口数据，不缓存图片或文件。

### 协商缓存（ETag / Last-Modified）

App 请求时在 Header 中附加 `If-None-Match: <etag>`

- 后端若数据未变化，返回 304 Not Modified（无 body），App 使用本地缓存内容

- 数据有变化时返回新数据，同时更新 etag

- 协商缓存能节省流量，但仍会触发请求到服务端，对减轻服务器压力效果有限

## App 实践

### 设置独立缓存区

创建独立缓存实例，不使用系统提供的全局缓存对象，避免影响三方库或默认 URLSession 的缓存行为，确保缓存策略可控。（WebView 的缓存是独立的，即使使用全局缓存对象也不会影响 H5 页面）

### 缓存大小控制

推荐设置：内存缓存：20 MB，磁盘缓存：100 MB

### 缓存清理策略

缓存目录命名包含 App 版本号，例如： AppAPICache_v1.0.0，每次 App 冷启动后检查当前版本是否为新版本，当用户升级 App 版本时清理旧版本缓存数据，清理操作异步执行，避免阻塞其它启动任务。版本化缓存管理可防止 App 强制升级后使用旧缓存，从而避免缓存数据结构与新版本 UI 页面不匹配引发的 Crash 或 UI 异常。

### iOS 代码样例（其它平台相似）

> 根据版本判断来清缓存

```swift
final class CacheVersionManager {

    private static let lastVersionKey = "AppLastVersionKey"

    /// 检查是否是 App 升级后的首次启动
    static func checkAndClearCacheIfNeeded(cache: URLCache) {
        let currentVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "0"
        let lastVersion = UserDefaults.standard.string(forKey: lastVersionKey)

        if lastVersion != currentVersion {
            cache.removeAllCachedResponses()
            
            UserDefaults.standard.set(currentVersion, forKey: lastVersionKey)
        }
    }
}
```

> 缓存规则设置

```swift
let urlCache = URLCache(memoryCapacity: 20 * 1024 * 1024, diskCapacity: 100 * 1024 * 1024, diskPath: "AppAPICache_v\(App.currentVersion)")

let config = URLSessionConfiguration.default
config.requestCachePolicy = .useProtocolCachePolicy
config.urlCache = urlCache
        
CacheVersionManager.checkAndClearCacheIfNeeded(cache: urlCache)
```

> 测试验证

通过抓包观察是否频繁发出请求，或在代码中打印 `response.metrics?.transactionMetrics.last?.resourceFetchType` 查看数据来源。

## 总结

App 仅做强缓存机制支持，具体哪些 GET 接口需要缓存以及缓存时间由后端 API 控制，后端调整缓存策略后 App 无需发版即可生效，相比在 App 内写死指定 API 及缓存时长，更加灵活和安全。