---
title: "了解 Block"
date: 2015-12-03 15:09:29 +0800
draft: false
---

[Block]() 是 Objective-C 语言创建闭包的方式，从 iOS4 开始 block 便在很多场景下替代了 delegate，相对来说 block 的最大优点就是可以使代码集中在一起，提高可读性，但也提高了代码调试的复杂度，并增加了循环引用产生的场景。

# 一些概念
Block 会使 app 运行成本增高，因为 delegate 只是保存了一个对象指针，而 block 本身实际上就是对象，它会被编译成 struct 并为其内容分配空间，struct 内容主要包括 isa 指针、block 对应实现函数的地址以及 block 复制过来的变量，这些内容也会随着需要从栈内存复制到堆内存。
  
- isa：指向 block 对应的 Class  
	- _NSConcreteGlobalBlock：定义在全局区的 block 会作为代码片段存在
	- _NSConcreteStackBlock：定义在方法中的 block 会保存在栈中，当函数返回时被销毁
	- _NSConcreteMallocBlock：为了增加 block 的生命周期，可以用 copy 方法将其复制到堆中，如果 block 已经在堆里了，再次进行 copy 只会增加引用计数

- IMP：block 块中的代码会作为方法形式存在，IMP 指向方法地址

- 复制的变量：block 能够读取它所在函数的内部变量，该变量会被复制到 struct 中，默认是值复制，不能修改，加上 __block 修饰的是引用复制，可以修改

# 简单例子

```objc
__block NSInteger mutiplier = 7; // 用 __block 修饰后，在 block 里就可以修改 mutiplier 的值
    
// 定义名为 myBlock 的代码块，返回值类型为 NSInteger，并有一个名为 num 的 NSInteger 型参数
NSInteger (^myBlock)(NSInteger) = ^(NSInteger num){
    mutiplier = 3;
        
    return num * mutiplier;
};
    
NSLog(@"%ld", myBlock(3)); // 像调用函数一样使用 block
```   

# 循环引用
对象之间相互持有便会造成循环引用问题，下面用一个经典例子看一下解决方式
```objc
// 因为 self 会强引用 block，所以将 self 定义成 weak
__weak __typeof(self)weakSelf = self; 

AFNetworkReachabilityStatusBlock callback = ^(AFNetworkReachabilityStatus status) {
    // 如果 block 里有多处引用 weakSelf，则需要转成 strongSelf，避免 weakSelf 因多线程导致其被释放后出现问题
    __strong __typeof(weakSelf)strongSelf = weakSelf; 
    
    strongSelf.networkReachabilityStatus = status;
    
    if (strongSelf.networkReachabilityStatusBlock) {
        strongSelf.networkReachabilityStatusBlock(status);
    }
};
```

并不是所有的 block 都会造成循环引用，关键点是 block 对象本身和它内部使用的对象是否互相持有，下面场景就不需要声明 weakSelf

```
[UIView animateWithDuration:0.3f animations:^{
    self.frame = .zero
}];
```

# 作为属性使用的场景
将 block 定义成类型

```
typedef void (^SelectedItemHandler)(NSString *itemId);
```

定义相关属性，虽然 strong 和 copy 的实际效果一样，为了代码可读性还是建议用 copy

```
@property (nonatomic, copy) SelectedItemHandler selectedHandler;
```

定义方法用来接收 block 参数并设置 block 属性，如有多个参数，block 参数应为最后一个

```
- (void)setSelectedItemHandler:(SelectedItemHandler)selectedHandler {
    self.selectedHandler = selectedHandler;
}
```

调用上面定义的方法，并传入 SelectedItemHandler 类型的 block 代码块

```
[self.bannerView setSelectedItemHandler:^(NSString *itemId) {
    ...
}];
```

当发生相关事件时触发 block 属性中的代码块

```
if (self.selectedHandler) {
    self.selectedHandler(self.items[indexPath.item][@"itemId"]);
}
```

