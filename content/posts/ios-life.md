---
title: "iOS 应用的生命周期"
date: 2015-03-28 11:23:29 +0800
draft: false
---

程序的生命周期是指应用程序从启动到结束整个阶段的全过程，点击应用图标打开程序，系统会首先通过 main 函数进行相关设置，然后通过 RunLoop 保持程序能够始终运行并监听处理分发事件，当没有事件发生时 RunLoop 便处于睡眠状态，节省资源。当发生事件后，RunLoop 将事件对象分发给相应视图处理。当用户按下 Home 键，应用会在进入后台后短暂运行，直到被系统挂起。

# main 函数
main 函数是 app 的入口函数   

```objc
int main(int argc, char * argv[]) {
    @autoreleasepool {
        return UIApplicationMain(argc, argv, nil, NSStringFromClass([AppDelegate class]));
    }
}
```  

- 在进入 main 函数之前，系统会由 dyld（the dynamic link editor）加载相关动态链接库，然后再初始化 runtime 环境，并由 runtime 触发 + load 方法，所以不要在 load 方法里执行耗时任务，否则会影响启动时间。
- @autoreleasepool 用来管理主线程中标记为自动释放的对象。
- UIApplicationMain 根据传入参数以及 info.plist 文件来初始化 app  
	- argc 和 argv 参数在 iOS 应用中用不到
	- 第三个参数为 app 的首要类名，用来监听并管理应用的生命周期，默认使用 UIApplication
	- 最后一个参数为 app 首要类的代理类，它负责实际处理 UIApplication 监听到的应用程序生命周期事件，具体参考 UIApplicationDelegate
	- main 函数会在初始化 app 后启动主线程及 RunLoop

# RunLoop
RunLoop 能够保持程序始终运行并监听处理分发事件，当没有事件发生时进入休眠状态，有事件发生时系统会将接收到的事件放在一个队列里，然后唤醒 RunLoop 依次处理事件，使用队列不仅可以解决线程同步问题也促使我们要把更新 UI 的代码放在主线程中运行，以免由于多个线程抢占资源产生奇怪的问题。RunLoop 可以接收的事件来自两种不同的来源，分别是输入源和定时源，输入源传递异步事件，事件通常来自于其他线程或程序，如一些 UI 事件等。定时源则传递同步事件，发生在特定时间或者重复的时间间隔，如 NSTimer。

RunLoop 的开启和退出

- 苹果提供了 NSRunLoop 和 CFRunLoopRef 来操作 Runloop，CFRunLoopRef 是线程安全的，NSRunLoop 基于 CFRunLoopRef 并提供了面向对象的 API，API 不是线程安全的
- 苹果不允许我们直接创建 Runloop，只能在线程内部通过 `[NSRunLoop currentRunLoop]` 来获取，第一次调用此方法时便会创建 Runloop
- 主线程的 Runloop 是默认开启的，子线程需要我们自己开启，并且在开启后通过添加 port 来监听事件，否则 RunLoop 在启动后便会结束（除了 NSTimer）
- 可以通过给 RunLoop 设置过期时间来使 Runloop 能够退出，或者通过 CFRunLoopStop 直接退出（会在执行完正在运行的事件后退出，并且如果给 Runloop 添加了 port，那么需要 remove port）

那么什么情况下需要我们在子线程中开启并使用 RunLoop 呢？

- 创建常驻线程，可以像 AFN 那样给新线程开启 Runloop 的同时添加端口来监听事件，这样它就能一直处于等待事件的状态中，线程就不会结束了。
- 线程间需要持续交互，需要在开启 Runloop 时同时指定一个用于唤醒它的 NSPort 端口对象，然后使用端口对象来进行多线程间的通信。
- 使用 NSTimer 或 performSelector 系列方法。
	- performSelecter:afterDelay: 会创建 timer 并添加到当前线程的 RunLoop 中，如果当前线程没有 RunLoop，此方法失效。
	- performSelector:onThread: 会创建 timer 并添加到指定线程的 RunLoop 中，如果指定线程没有 RunLoop，此方法失效。

不同的事件源会运行在 RunLoop 的不同模式中，它们只有在相匹配的情况下才会被处理。这种工作方式利于 RunLoop 更好的管理和处理事件，使它们之间不相互影响。

- NSTimer 运行在 NSDefaultRunLoopMode 模式下。
- 列表滚动事件运行在 UITrackingRunLoopMode 模式下。
- NSRunLoopCommonModes 包含 NSDefaultRunLoopMode 和 UITrackingRunLoopMode。 

我们可以通过改变一些事件操作的 RunloopMode 来提高用户体验

在列表中加载图片时，让加载图片的操作处于 NSDefaultRunLoopMode 中，这样在列表滚动时便不会加载图片，列表的滚动速度便会有所提升

```objc
[self.imageView performSelector:@selector(setImage:) withObject:image afterDelay:0 inModes:@[NSDefaultRunLoopMode]];
```

在列表中使用 NSTimer 时，默认情况下在滚动时 timer 会停止，这时可以将 timer 运行在 NSRunLoopCommonModes 下，便可以在表格静止以及滚动时都能够正常运行。

```objc
[[NSRunLoop currentRunLoop] addTimer:timer forMode:NSRunLoopCommonModes];
```

需要注意的是 NSTimer 并不是以子线程的方式运行，它只是在 RunLoop 里注册了一下，RunLoop 会根据 timer 的设置情况去检测并触发，所以任务在执行过程中一旦出现延迟，那么会丢失执行次数，如果对精确度有要求的话，可以使用 dispatch_time，GCD 不受 RunLoop 影响。 

关于 RunLoop 的具体介绍详见[官方文档](https://developer.apple.com/library/content/documentation/Cocoa/Conceptual/Multithreading/RunLoopManagement/RunLoopManagement.html#//apple_ref/doc/uid/10000057i-CH16-SW1)

# 事件传递&事件响应
当发生触摸操作后，系统会将这一事件封装成 UIEvent 对象并放到由 UIApplication 管理的事件队列中，再由 RunLoop 接收事件并传递给触摸点所在的视图，该视图即为 "hit-test视图"，而查找这一视图的过程就叫做 "hit-testing"。hit-testing 过程大致如下: 
 
- RunLoop 将接收到的事件分发给 UIWindow。
- UIWindow 通过 hitTest:withEvent: 方法在视图树中递归查找触摸点所在的视图。
- 当前视图通过 hitTest 方法调用 pointInside:withEvent: 来判定触摸点是否在当前视图，如果不在 hitTest 返回 nil，在的话则从当前视图的 subViews 末尾向前遍历，依次向每个 subView 发送 hitTest 消息，以此规则一直到某个 subView 不再返回 nil 或遍历完成。
- 最终由最后一个遍历到并且不返回 nil 的视图作为 hit-test视图。

在这过程中如果视图不具备响应事件的条件(userInteractionEnabled 或 enabled 为 NO，hidden=YES 或 alpha=0)，那么 hitTest 就不会调用 pointInside 方法，会直接返回 nil，该视图的子视图也就不会被遍历到，如果我们想改变这一点，或者有别的需求需要改变事件传递的规则，那么需要自定义父视图并重写以下方法来控制子视图。

```objc
- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event;
- (BOOL)pointInside:(CGPoint)point withEvent:(UIEvent *)event;
```

如果想在某种情况下不响应事件，可以在适当时调用 UIApplication 的以下方法停止和恢复事件接收和分发。

```objc
- (void)beginIgnoringInteractionEvents
- (void)endIgnoringInteractionEvents
```

如果 hit-test 视图不处理收到的事件（没有重写 touches 方法，或者只是在 touches 方法里调用 [super touches..]），则通过响应者链机制寻找其它响应者来处理。

响应链由一系列链接在一起的响应者组成。如果一个响应者不能处理事件，则会将事件沿着响应链传到下一响应者。下一响应者有可能是它的父视图也可能是它所在的 ViewController，系统会以此类推一直传递到 UIApplication。如果整个过程都没有响应者响应事件，该事件就会被丢弃。否则事件便会停止传递交由响应者处理。

在开发过程中，有时我们不得不定义一个很小的按钮，为了避免发生用户点不到按钮的事情发生，可以利用上面的知识，扩大按钮的有效范围，只要触碰到按钮附近就使按钮响应事件。解决办法就是自定义继承 UIButton 的视图，并重写 pointInside:withEvent 方法。

```objc
- (BOOL)pointInside:(CGPoint)point withEvent:(UIEvent *)event {
    CGRect bounds = self.bounds;

    CGFloat widthDelta = MAX(44.0 - self.bounds.size.width, 0);
    CGFloat heightDelta = MAX(44.0 - self.bounds.size.height, 0);

    bounds = CGRectInset(self.bounds, -0.5 * widthDelta, -0.5 * heightDelta);

    return CGRectContainsPoint(bounds, point);
}
```

当子视图添加到父视图后，其响应事件的范围就是父视图的 bounds，如果部分界面超出了这个范围，则超出部分无法响应事件，未超出部分仍然可以响应事件，为了使超出父视图范围的子视图也能响应事件，需要实现主视图的 `- hitTest:withEvent:` 方法。

```objc
- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event {
    UIView *view = [super hitTest:point withEvent:event];
    
    if (!view) {
        for (UIView *subView in self.subviews) {
            CGPoint p = [subView convertPoint:point fromView:self];
            if (CGRectContainsPoint(subView.bounds, p)) {
                view = subView;
            }
        }
    }
    
    return view;
}
```

# 前后台切换
在程序进入后台后仍然能够在短时间里执行一些代码，然后便进入挂起状态，程序在挂起后仍然会驻留在内存中，但是不能执行代码，直到 iOS 系统内存降低发出警告后才会把相对耗内存的挂起程序清除掉。  

当程序在前后台切换时，系统会调用 UIApplicationDelegate 的相关代理方法并发送通知，我们可以在不同情况下做出不同处理，例如在进入后台时暂停某些操作或存储某些数据，当恢复到前台时再恢复之前的暂停操作或读取之前存储的数据。


