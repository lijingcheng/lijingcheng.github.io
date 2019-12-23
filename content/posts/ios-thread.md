---
title: "iOS 多线程开发"
date: 2015-06-03 15:07:00 +0800
draft: false
---

合理的线程分配能够提高程序的执行效率和资源利用率，在 iOS 开发中通常使用 GCD 或 Operation Queue 来操作线程，GCD 基于 C API，Operation Queue 是在 GCD 基础上实现的，效率上较 GCD 会差一点点，但代码可读性和易用性较高，简单的任务可用 GCD 去实现，复杂一些的还是推荐使用 Operation Queue 来处理。微小的性能提升远不如写出可维护性高的代码来的实在。

# 一些概念
- 进程和线程
	- 进程是一个可执行程序，它拥有自己的地址空间，至少有一个线程，也可以包含多个线程，进程内的线程对于其他进程不可见
	- 线程是执行程序最基本的单元，在进程中负责执行任务并使用进程的地址空间，每个进程至少有一个线程（主线程）

- 主线程和子线程
	- 主线程是随着进程的创建而创建的，主线程结束，其他线程也会结束
	- 子线程由其他线程创建，一般子线程退出不会影响主线程

- 同步和异步
	- 同步任务在执行过程中会阻塞当前线程，直到任务执行完毕
	- 异步任务在执行过程中不会阻塞当前线程

- 串行队列和并行队列
	- 串行队列中装载的线程是按进队列顺序一个一个执行
	- 并行队列中装载的线程可以一起执行，可以通过设置最大并发数，限制同时最多执行几个线程

- 并发和并行
	- 并发在多核设备上是真正意义上的多任务同时运行，而在单核设备上是以分时共享的方式同时执行多个任务，需要先运行一个线程，执行一个上下文切换，然后运行另一个线程或进程，因为这个过程很快所以会给我们并发执行的错觉
	- 并行是真正意义上的多任务同时运行

- 优先级和优先级反转
	- 正常情况下优先级高的任务会比优先级低的先执行
	- 优先级反转指程序在运行时，低优先级的任务由于某种原因不能释放掉锁，所以阻塞了高优先级的任务，而其他不需要该共享资源的低优先级任务会在高优先级任务之前执行，从而反转了任务的优先级。设置任务的优先级会让本来就复杂的并行编程变得更加复杂和不可预见，所以建议只使用默认优先级。

- 生产者和消费者模式：是通过一个容器来解决生产者和消费者的强耦合问题。生产者和消费者彼此之间不直接通讯，而通过阻塞队列来进行通讯，所以生产者生产完数据之后不用等待消费者处理，直接扔给阻塞队列，消费者不找生产者要数据，而是直接从阻塞队列里取，阻塞队列就相当于一个缓冲区，平衡了生产者和消费者的处理能力。我们还可以使用多个线程来生产数据，同样可以使用多个消费线程来消费数据。而更复杂的情况是，消费者消费的数据，有可能需要继续处理，于是消费者处理完数据之后，它又要作为生产者把数据放在新的队列里，交给其他消费者继续处理。

- 为了防止多个线程抢夺同一个资源造成数据安全问题可采取以下措施
	- 锁：在同一时刻，只允许一个线程访问某个特定资源
		- NSLock：最基本的锁，通过 lock 和 unlock 加锁解锁，@synchronize 会自动加锁解锁，但性能稍差
		- NSRecursiveLock：递归锁，可以在一个线程中反复获取锁不会造成死锁，可用在循环或递归操作中
		- NSConditionLock：条件锁，为加锁/解锁设置条件
	- 信号量：和锁很像，区别在于它可以控制同时访问同一资源的线程个数
	- 串行队列：一个一个执行就避免了同步问题

- 死锁：当多个线程在相互等待对方结束时，就会发生死锁，在下面的例子中，大多数时候 swap 方法都能正常运行，但是当两个线程使用相反的值来同时调用 swap 时，程序就会很可能由于死锁而被终止。线程1 获得了 X 的一个锁，线程2 获得了 Y 的一个锁。接着它们会同时等待另外一把锁，但是永远都不会获得。所以我们要尽量减少线程间资源共享，并确保共享的资源尽量简单。

```objc
void swap(A, B)
{
    lock(A);
    lock(B);
    
    ...
    
    unlock(B);
    unlock(A);
}

swap(X, Y); // 线程1
swap(Y, X); // 线程2
```

# NSThread
使用 NSThread 创建并操作线程在使用上相对简单一些，但是需要我们自己去管理线程的生命周期。所以总的来说易用性上不如 GCD，功能上不如 Operation Queues。

创建并启动线程

```objc
NSThread *thread = [[NSThread alloc] initWithTarget:self selector:@selector(run:) object:nil];
[thread start];
```

线程通讯

```objc
- (void)performSelectorOnMainThread:withObject:waitUntilDone:modes:; 
- (void)performSelectorOnMainThread:withObject:waitUntilDone:; 
- (void)performSelector:onThread:withObject:waitUntilDone:modes:;
- (void)performSelector:onThread:withObject:waitUntilDone:;
```

perform 方法只对拥有 RunLoop 的线程有效，如果创建的线程没有添加 RunLoop，perform 的 selector 将无法执行，如果该线程不存在了，程序会 Crash。

# GCD（Grand Central Dispatch）
GCD 是苹果为多核的并行计算提出的解决方案，它会自动地利用更多的 CPU 内核（比如双核、四核），最重要的是它会自动管理线程的生命周期（创建线程、调度任务、销毁线程）。同时它基于 C 语言，使用 Block 方式，使用起来更加方便灵活。

最常用的使用方式是通过 dispatch_async 异步执行耗时操作，由于 UIKit 中大部分类都不是线程安全的，所以需要在主队列中处理 UI，在 dispatch 到主队列时 libDispatch 会唤醒主线程的 Runloop，并把 block 中的内容交给 Runloop 来处理，如果 dispatch 到其他线程则由 libDispatch 自己处理，需要注意的是当你监听某个通知并在响应代码里更新 UI 时相关代码也需要放在主线程里，因为发送通知的代码可能不在主线程。

```objc
dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    dispatch_async(dispatch_get_main_queue(), ^{
        ...
    });
});
```

GCD 有 5个不同队列：主队列，3个不同优先级的全局队列，以及一个优先级更低的后台队列（用于 I/O），我们还可以自己创建队列。通常不建议给队列设置优先级，因为多任务在访问共享资源时，可能会造成优先级反转问题。

获取主队列：主队列是串行队列，所以比较适合处理共享资源、更新 UI 等事情，主队列中的代码在主线程中执行，但主线程中除了主队列，还可以执行其它队列的代码。

```objc
dispatch_queue_t queue = dispatch_get_main_queue();
```

获取不同优先级的全局队列：全局队列是并行队列，支持数百个线程执行  

```objc
dispatch_queue_t queue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0);
dispatch_queue_t queue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0);
dispatch_queue_t queue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_LOW, 0);
```

如果经常需要在后台队列上执行开销庞大的操作，可通过 dispatch_queue_create 函数创建新队列，它接收两个参数，第一个是标识符，可以在 Instruments 或 lldb 调试程序时查看队列名字，第二个参数用来表示创建的队列是串行还是并行，DISPATCH_QUEUE_SERIAL 或 NULL 表示串行，DISPATCH_QUEUE_CONCURRENT 表示并行。    

```objc
NSString *queueLabel = [NSString stringWithFormat:@"%@.%p.queue1", [self class], self];

dispatch_queue_t queue = dispatch_queue_create([queueLabel UTF8String], DISPATCH_QUEUE_SERIAL);  
dispatch_queue_t queue = dispatch_queue_create([queueLabel UTF8String], DISPATCH_QUEUE_CONCURRENT);
```

创建任务并交给队列处理  

```objc
// 异步任务
dispatch_async(dispatch_get_main_queue(), ^{
    ...
});

// 同步任务
dispatch_sync(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    ...
});
```

同步任务很容易造成死锁，主要发生在串行队列中，并且同步任务所在队列为当前队列

```objc
// dispatch_sync 将 block 中的任务加入到主队列队尾，按照队列的先进先出规则，该任务要等主线程中的其它任务执行完成后才能执行，但是因为 block 中的任务是要求同步执行的，所以主线程中的其它任务会等 block 中的任务执行完后才去执行，这时双方互相等待造成死锁。
dispatch_sync(dispatch_get_main_queue(), ^{
	...
});

// 同上
dispatch_queue_t queue = dispatch_queue_create("queue1", NULL); 
dispatch_async(queue, ^{
    dispatch_sync(queue, ^{
        ...
    });
});
```

下面例子会打印什么呢？

```objc
dispatch_async(dispatch_get_global_queue(0, 0), ^{
    NSLog(@"任务1");
    
    dispatch_sync(dispatch_get_main_queue(), ^{ 
        NSLog(@"任务2");
    });
    
    NSLog(@"任务3");
});

NSLog(@"任务4");

while (YES) {
    ...
}
```

会先打印主线程中的 `任务4`，然后在主线程中执行 `while` 死循环，再打印新创建线程中的 `任务1`，`任务2` 是在主线程中执行，并且由于是同步操作，所以它会一直等待 `while` 结束才会执行，这时程序就卡死了。如果将 `任务2` 改成异步执行，那么 `任务3` 会先打印出来，但因为 `任务2` 是在主线程中，所以它还是会等待 `while` 结束，程序依旧会卡死。

队列和线程的关系：队列可按照同步或异步的方式来组织并执行任务，同步异步的区别在于是否会阻塞当前线程，以及是否会开启新线程。

```objc
NSLog(@"任务1%@", [NSThread currentThread]); // 在主线程中执行
    
dispatch_queue_t serialQueue = dispatch_queue_create("test.serialQueue", DISPATCH_QUEUE_SERIAL);
dispatch_queue_t concurrentQueue = dispatch_queue_create("test.concurrentQueue",DISPATCH_QUEUE_CONCURRENT);

for (int i = 0; i < 5; i++) {
    // 同步执行的任务不管是位于串行队列还是并行队列，都是串行效果，它们都会在当前线程中执行（全局队列换成 serialQueue 或 concurrentQueue 结果是一样的）
    dispatch_sync(dispatch_get_global_queue(0, 0), ^{
        NSLog(@"任务2%@", [NSThread currentThread]);
    });
        
    // 异步执行任务如果不是放在主队列中的话都会开启新的线程，如果任务位于串行队列，该队列中就算放入多个任务，也只会创建一个线程
    dispatch_async(serialQueue, ^{
        NSLog(@"任务3%@", [NSThread currentThread]);
    });
        
    // 异步执行的多个任务如果位于并行队列，会由操作系统决定要开启多少线程，有可能多个任务会共用一个线程。(全局队列换成 concurrentQueue 结果是一样的)
    dispatch_async(dispatch_get_global_queue(0, 0), ^{
        NSLog(@"任务4%@", [NSThread currentThread]);
    });
}
```

当 dispatch_sync 的目标队列不是主队列时， 这个同步任务在哪个线程，那么 Block 中的代码就会在哪个线程中执行，下面的测试代码都是在主线程中执行，可以通过 isMainThread 的输出结果验证一下。

```objc
dispatch_sync(dispatch_get_global_queue(0, 0), ^{
     NSLog(@"%d", [NSThread isMainThread]); // 输出 1，同时证明了主线程中除了主队列，还可以执行其它队列
});

dispatch_async(dispatch_get_global_queue(0, 0), ^{
    dispatch_sync(dispatch_get_global_queue(0, 0), ^{
         NSLog(@"%d", [NSThread isMainThread]); // 输出 0
    });
});
```

因为 isMainThread 存在这个问题，所以建议通过判断是否是主队列来替代 isMainThread，如果你使用 Objective-C 语言开发，可以参考 SDWebImage 的实现。

```objc
#ifndef dispatch_main_async_safe
#define dispatch_main_async_safe(block)\
    if (strcmp(dispatch_queue_get_label(DISPATCH_CURRENT_QUEUE_LABEL), dispatch_queue_get_label(dispatch_get_main_queue())) == 0) {\
        block();\
    } else {\
        dispatch_async(dispatch_get_main_queue(), block);\
    }
#endif
```

如果你使用的 Swift，可参考 RxSwift 对是否是主队列的实现。

```swift
extension DispatchQueue {
    private static var token: DispatchSpecificKey<()> = {
        let key = DispatchSpecificKey<()>()
        DispatchQueue.main.setSpecific(key: key, value: ())
        return key
    }()

    static var isMain: Bool {
        return DispatchQueue.getSpecific(key: token) != nil
    }
}
```

NSTimer 在使用时会受 RunLoop 影响而导致延迟触发，当有更精准的计时需求时，可用 GCD 的计时器

```objc
dispatch_source_t timer = dispatch_source_create(DISPATCH_SOURCE_TYPE_TIMER, 0, 0, dispatch_get_global_queue(0, 0));
dispatch_source_set_timer(timer, dispatch_walltime(NULL, 0), 1.0 * NSEC_PER_SEC, 0);// 每秒触发一次
    
dispatch_source_set_event_handler(timer, ^{
	dispatch_async(dispatch_get_main_queue(), ^{
    	if(...) { 
       		dispatch_source_cancel(timer); // 停止
   		}
  	});
});
    
dispatch_resume(timer); // 启动
```

dispatch_once 可以控制 Block 中的代码只被执行一次，通常用于创建单例，如果需要完整的单例，不被人 alloc 还需要进一步处理

```objc
+ (instancetype) sharedInstance {
    static dispatch_once_t pred = 0;
    static ClassName *sharedObject = nil;
    
    dispatch_once(&pred, ^{
        sharedObject = [[self alloc] init];
    });
    
    return sharedObject;
}
```

延迟处理，类似于 performSelector:withObject:afterDelay:，可指定时间和处理队列

```objc
dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(1 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
 	...
});
```

当使用 foreach 遍历数组遇到效率问题时，可以考虑用 dispatch_apply 进行快速迭代，dispatch_apply 是 dispatch_sync 和 Dispatch Group 的关联 API，所以它会阻塞当前线程

```objc
dispatch_apply(array.count, dispatch_get_global_queue(0, 0), ^(size_t index) {
	NSLog(@"%zu", index); // 由于任务在并发队列中，所以 index 为乱序
});

NSLog(@"done"); // 由于当前线程被阻塞，所以迭代结束后，此句才会执行
```

iOS8 开始支持取消任务

```objc
dispatch_queue_t serialQueue = dispatch_queue_create("queue1", DISPATCH_QUEUE_SERIAL);
    
dispatch_block_t firstBlock = dispatch_block_create(0, ^{
	...
});
    
dispatch_block_t secondBlock = dispatch_block_create(0, ^{
	...
});
    
dispatch_async(serialQueue, firstBlock);
dispatch_async(serialQueue, secondBlock);
    
dispatch_block_cancel(secondBlock);
```

多任务并发，都完成后触发另一个任务，可通过队列组实现，例如同时下载 2张图片，都下载完成后再将他们拼接起来  

```objc
dispatch_group_t group = dispatch_group_create();
dispatch_queue_t queue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0);

// 任务1
dispatch_group_async(group, queue, ^{
    // 下载资源1
});

// 任务2
dispatch_group_async(group, queue, ^{
    // 下载资源2
});

// 任务1 和任务2 都完成后会自动通知
dispatch_group_notify(group, dispatch_get_main_queue(), ^{
    // 处理资源1和资源2
});
```

dispatch_barrier_async 在执行任务时会确保队列在此过程不会执行其它任务，可以在适当时候用来解决同步问题，它只在自己创建的队列上有这种作用，在全局并发队列和串行队列上，效果和 dispatch_sync 一样

```objc
dispatch_queue_t queue = dispatch_queue_create("queue1", DISPATCH_QUEUE_CONCURRENT);
    
dispatch_async(queue, ^{
    ...
});
dispatch_async(queue, ^{
    ...
});
    
// 在 dispatch_barrier_async 前面的任务执行结束后才执行，后面的任务等它执行完成后才会执行
dispatch_barrier_async(queue, ^{
    ...
});
    
dispatch_async(queue, ^{
    ...
});
dispatch_async(queue, ^{
    ...
});
``` 

dispatch_barrier_async 能够高效的解决属性的同步问题（get 方法可以并发执行，但是 set 方法只能同步执行并且在执行过程中 get 方法不能同时执行）

```objc
_syncQueue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0);
    
- (NSString *)userName {
    __weak NSString *localUserName;
    dispatch_sync(_syncQueue, ^{
        localUserName = _userName;
    }
    return localUserName;
}
    
- (void)setUserName:(NSString *)userName {
    dispatch_barrier_async(_syncQueue, ^{
        _userName = userName;
    }
}
```

利用 dispatch_semaphore_t 信号量限制任务并发数，dispatch_semaphore_wait 函数会消耗一次这个可用数，如果可用数已满则开始等待，dispatch_semaphore_signal 函数每次执行都会将该可用计数加 1，以此来表明已经释放了资源，如果此刻有因为等待可用资源而被阻塞的任务，系统会从等待的队列中解锁一个任务来执行。

```objc
dispatch_semaphore_t semaphore = dispatch_semaphore_create(1);// 只有一个停车位
    
if (dispatch_semaphore_wait(semaphore, dispatch_time(DISPATCH_TIME_NOW, (int64_t)(4.0 * NSEC_PER_SEC)))) {
    NSLog(@"不等了，开走");
} else {
    NSLog(@"第一辆车来了，有位置直接停"); // 1
}

dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    if (dispatch_semaphore_wait(semaphore, dispatch_time(DISPATCH_TIME_NOW, (int64_t)(4.0 * NSEC_PER_SEC)))) {
        NSLog(@"不等了，开走");
    } else {
        NSLog(@"第二辆车,等到有位置后停车"); // 3
    }
});

dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    sleep(2);
    NSLog(@"第一辆车开走，这时第二辆车准备停车"); // 2
    dispatch_semaphore_signal(semaphore);
});

dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    if (dispatch_semaphore_wait(semaphore, dispatch_time(DISPATCH_TIME_NOW, (int64_t)(4.0 * NSEC_PER_SEC)))) {
        NSLog(@"第三辆车不等了，开走"); // 4
    } else {
        NSLog(@"有位置，停车");
    }
});

dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    sleep(5);
    NSLog(@"第二辆车开走，第三辆车没有继续等"); // 5
    dispatch_semaphore_signal(semaphore);
});
```

# Operation Queues
GCD 提供了更加底层的控制，而操作队列则在 GCD 之上实现了一些方便的功能，这些功能对于我们来说通常是最好最安全的选择，使用时需要将任务封装到一个 NSOperation 对象中，再将它添加到 NSOperationQueue，系统会将 NSOperationQueue 中的 NSOperation 取出并放到线程上执行。

NSOperationQueue 默认是串行队列，可通过设置 maxConcurrentOperationCount 实现并发

```objc
// 获取主队列
NSOperationQueue *mainQueue = [NSOperationQueue mainQueue];

// 创建队列
NSOperationQueue *queue = [[NSOperationQueue alloc] init];
```

NSOperation 不能够直接使用，可通过它的两个子类来封装任务，或者自定义 Operation
- NSInvocationOperation：通过 SEL 方式添加任务
- NSBlockOperation：通过 Block 方式添加任务
- 自定义 Operation：需要继承 NSOperation 类，并实现 main 方法

NSOperation 有一个非常实用的功能，可以添加和解除依赖。但要注意，不能相互依赖，否则会造成死锁，例如 A 依赖 B，B 依赖 A。

```objc
NSBlockOperation *operation1 = [NSBlockOperation blockOperationWithBlock:^{
    // 下载资源1
}];
    
NSBlockOperation *operation2 = [NSBlockOperation blockOperationWithBlock:^{
    // 下载资源2
}];
    
NSBlockOperation *operation3 = [NSBlockOperation blockOperationWithBlock:^{
    // 处理资源1和资源2
}];
    
[operation3 addDependency:operation1];      // 任务三依赖任务一
[operation3 addDependency:operation2];      // 任务三依赖任务二
    
[[NSOperationQueue mainQueue] addOperations:@[operation3, operation2, operation1] waitUntilFinished:NO];
```

在做多线程开发时，要合理的进行线程分配并且控制线程数量，为了追踪线程操作，每个线程还要起好名字。主线程主要用来做 UI 操作和数据处理，而日志记录，网络请求都可以安排在各自的线程中，为了检查 UI 操作是否在主线程中执行，可以 hook 掉 UIView 和 CALayer 的 `setNeedsDisplay`、`setNeedsDisplayInRect:`、`setNeedsLayout` 这三个方法。

