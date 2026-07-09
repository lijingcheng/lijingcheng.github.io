---
title: "iOS 应用的启动任务设计"
date: 2019-08-29 15:18:55 +0800
draft: false
---

从点击 app 图标到看到首页内容就算是一次启动过程，在这个短则一两秒的过程中 app 要做的事情却有很多，本文主要介绍如何管理这些任务的执行方式和优先级问题。

下面列出 app 启动过程中会去执行的一些主要任务：

- 设置 app UI 样式

- 开启定位、埋点、网络状态监听、通知监听等服务

- 初始化一些第三方服务

- 如果是通过点击推送通知进入的 app 还会去存储相关数据用于在进入首页后跳转页面或弹框

- 访问一些接口并处理返回结果

上面列出的大部分任务都不需要我们主动去管理，只要在处理过程中注意不要影响启动速度就可以了，需要我们去管理的任务主要是对于一些接口返回数据的处理，像 `升级检查`、`换肤`、`弹窗广告` 这类接口在拿到返回数据后不能够马上处理，而是需要先保存数据然后等待首页展示出来后再做 UI 效果处理，并且这些任务通常还需要考虑优先级问题，例如当需要展示升级提示时就不应该再展示弹窗广告。

我目前的处理方案是基于 RxSwift 响应式编程框架实现，每项任务都是可以被订阅的，订阅者可以监听任务状态并作出响应，每项任务的最初状态是 `unknown` 未知的，也就是接口还未返回数据时的状态，当接口返回数据后，再根据情况将状态改为 `need` 或 `noneed`，也就是需要处理或不需要处理，我们可以让接口调用处只将关注点放在改变任务状态上，不同状态时该如何处理是由该任务的管理类决定，具体什么时候以及是否需要处理则是由该任务的订阅者去决定。

下面以 `检查升级` 任务为主线看下具体代码实现，首先在 app 启动后发起异步接口调用，并根据返回数据修改任务状态，此时不用考虑 app 是否已经进入首页，以及如果弹框提示用户等功能

```swift
NetworkService.get("xxx.api") { [weak self] (result, error) in
    if ... {
        Task.shared.upgrade.accept(.need)
    } else {
        Task.shared.upgrade.accept(.noneed)
    }
}
```

当 app 进入首页后，会在 viewDidAppear 方法中发出 Notification 用来触发任务订阅管理功能

```swift
NotificationCenter.default.rx.notification(Notification.Name.Event.appDidAppear).subscribe(onNext: { notification in
    Task.shared.subscribe()
}).disposed(by: disposeBag)
```

然后我们再来看下 Task 的具体实现，在下面例子中列出了七个需要处理的任务，其中`换肤`、`小红点`、`过期提醒`这三个任务是进入首页后就可以直接执行，不用考虑优先级问题，而`升级提示`、`切换城市`、`弹窗广告`、`推送跳转`这四个任务之间有优先级关系，需要特殊处理一下

```swift
struct Task {
    static let shared = Task()
    
    private init() {
    }
    
    enum Status: Int {
        case unknown, need, noneed
    }
    
    // BehaviorRelay 类型的任务在被订阅后，订阅者会先收到最近一次的事件或初始事件
    var upgrade = BehaviorRelay(value: Status.unknown) // 升级弹框
    var switchCity = BehaviorRelay(value: Status.unknown) // 切换城市弹框
    var popAdvertise = BehaviorRelay(value: Status.unknown) // 弹窗广告
    var apns = BehaviorRelay(value: Status.unknown) // 推送跳转
    var skin = BehaviorRelay(value: Status.unknown) // 换肤
    var trackPoint = BehaviorRelay(value: Status.unknown) // 用于 tabBarItem 等地方的小红点提醒
    var remind = BehaviorRelay(value: Status.unknown) // 以气泡视图形式展示的过期提醒
    
    private let disposeBag = DisposeBag()
    
    func subscribe() {
        // 升级弹框的优先级最高，不管当前在干什么都会直接弹框
        upgrade.subscribe(onNext: { status in
            if status == .need {
                NotificationCenter.default.post(name: NSNotification.Name.Event.hidePopAdvertise, object: nil)
                // 取消切换城市等弹框，显示升级提示弹框
            }
        }).disposed(by: disposeBag)
        
        // 切换城市弹框优先级仅次于升级提示
        switchCity.subscribe(onNext: { status in
            guard self.upgrade.value != .need else {
                return
            }
            
            if status == .need {
                NotificationCenter.default.post(name: NSNotification.Name.Event.hidePopAdvertise, object: nil)
                // 显示切换城市弹框
            }
        }).disposed(by: disposeBag)
        
        // 弹窗广告优先级次于升级提示和切换城市
        popAdvertise.subscribe(onNext: { status in
            guard self.upgrade.value != .need, self.switchCity.value != .need else {
                return
            }
            
            if status == .need {
                NotificationCenter.default.post(name: NSNotification.Name.Event.showPopAdvertise, object: nil)
            }
        }).disposed(by: disposeBag)
        
        // 推送跳转优先级在这个例子里排最后
        apns.subscribe(onNext: { status in
            // 当需要考虑优先级的任务非常多时，下面的 guard 语句就会显得比较难看，并且其他任务的处理方式也会变得复杂，所以目前实现方式更适用于中小项目
            guard self.upgrade.value != .need, self.switchCity.value != .need, self.popAdvertise.value != .need else {
                return
            }
            
            if status == .need {
                NotificationCenter.default.post(name: NSNotification.Name.Event.apns, object: nil)
            }
        }).disposed(by: disposeBag)
        
        // 需要换肤时直接通知相关服务
        skin.subscribe(onNext: { status in
            if status == .need {
                NotificationCenter.default.post(name: NSNotification.Name.Event.skin, object: nil)
            }
        }).disposed(by: disposeBag)
        
        // 需要展示小红点提醒时直接通知相关服务
        trackPoint.subscribe(onNext: { status in
            if status == .need {
                NotificationCenter.default.post(name: NSNotification.Name.Event.trackPoint, object: nil)
            }
        }).disposed(by: disposeBag)
        
        // 需要展示过期提醒时直接通知相关服务
        remind.subscribe(onNext: { status in
            if status == .need {
                NotificationCenter.default.post(name: NSNotification.Name.Event.remind, object: nil)
            }
        }).disposed(by: disposeBag)
    }
}
```

上面介绍的方案应该能够满足大部分 app 的需求，如果你的 app 在使用组件化的同时业务也超鸡儿复杂，有很多需要考虑优先级的任务，则需要另外考虑实现方案或者对上面方案进行扩展，比如在 Task 中增加一个队列，用于存储当前需要执行的所有任务，并且任务可根据设置的优先级调整其在队列中的顺序，并支持挂起、执行中、已完成等状态，就像 NSOperationQueue 那样。。。

