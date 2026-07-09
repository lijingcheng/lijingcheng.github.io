---
title: "iOS 内存管理"
date: 2015-07-12 15:07:54 +0800
draft: false
---

[内存管理]() 指程序在运行时申请内存，并在使用完后释放内存的过程，内存管理不当造成的主要问题便是内存泄漏和过度释放，虽然 ARC 使我们可以不去关注内存管理上的一些细节问题，但掌握一些相关知识还是很有必要的。

# 一些概念
- MRC：manual reference counting，自己编写内存管理代码（retain、release、autorelease...）

- ARC：automatic reference counting，编译器会在编译阶段为代码加上优化过的内存管理代码，这样就可以让我们不必花费大量时间在内存管理上面，可以将更多的精力放在业务代码上。

- 内存泄漏：不再使用的对象内存没有释放掉，将导致内存占用无限增长，即便是使用 ARC，也会因为循环引用问题而造成内存泄露，并且还要注意与 CoreFoundation 对象进行桥接时要手动释放内存。

- 内存过度释放：释放了仍需要使用中的对象，将有可能导致应用崩溃

# 内存管理规则
内存管理是建立在对象的拥有关系上的，当拥有对象后就要负责释放它，并且不要释放非自己持有的对象，具体规则如下：

拥有对象所有权
- 通过 alloc/new/copy/mutableCopy 创建对象
- 在某些场景里避免一个对象被移除，可以对它进行 retain

```objc
Student * stu1 = [[Student alloc] init];

Student * stu2 = [stu1 retain];
```

放弃对象拥有权
- 立即释放：给对象发送一个 release 消息
- 延迟释放：给对象发送一个 autorelease 消息

```objc
+ (Student *)studentWithName:(NSString *)name {
    Student *stu = [[Student alloc] initWithName:name];
    
    return [stu autorelease];
}
```

实现 dealloc 方法来释放对象自身内存与它所持有的资源，此方法由系统在该对象被销毁时自动调用

```objc
- (void)dealloc {
	[_firstName release];
	[_lastName release];

	[super dealloc]; // 必须先释放自己占有的资源再通过此行代码释放自己
}
```

ARC 带来的变化

- 不能够自己调用 retain/release/autorelease，由编译器自动插入
- dealloc 方法中不能调用 [super dealloc] ，由系统去调用并释放实例变量和 assocate 对象，weak 对象也是在这时被设置为 nil，我们只需要释放一些资源，如通知、KVO 等

# 引用计数
内存管理规则中的对象所有权是通过引用计数来实现，除了常量以外，每个对象都有一个引用计数。

- 创建对象时，计数为 1
- 给对象发送 retain 消息时，计数加 1
- 给对象发送 release 消息时，计数减 1
- 给对象发送 autorelease 消息时，计数在当前自动释放池代码块结束时减 1
- 当对象的计数为 0 时将被销毁

![](/images/retaincount.jpeg)

# 属性修饰符

### MRC 中包括 assign/copy/retain
assign 表示在 setter 中仅是简单的赋值，不改变引用计数，一般用来修饰基本类型和 delegate 属性

```objc
@property (nonatomic, assign) NSInteger count;

@property (nonatomic, assign) id delegate; // 避免引用循环，但要在适当时候设置为 nil

// 对应 setter 方法
- (void)setCount:(NSInteger)count {
	_count = count;
}
```

copy 表示在 setter 中将参数进行内存 copy 后再进行赋值，一般用于不可变字符串、字典、Block

```objc
@property (nonatomic, copy) NSString *userName; 

// 对应 setter 方法
- (void)setUserName:(NSString *)userName {
  id tempName = [userName copy];
  [_userName release];
  _userName = tempName;
}
```

retain 表示在 setter 中将参数对象 retain 后再进行赋值，一般用于可变字符串、可变字典及其他对象

```objc
@property (nonatomic, retain) NSMutableString *userName;

// 对应 setter 方法
- (void)setUserName:(NSString *)userName {
  [userName retain];
  [_userName release];
  _userName = userName;
}
```

### ARC 中包括 assign/weak/unsafe_unretained/copy/strong
- assign：同 MRC 中的 assign 一样，只是不再用来修饰 delegate 对象。

- weak：可以避免循环引用，用来修饰对象，但在 setter 中是简单赋值，不改变引用计数，和 assign 的区别在于属性被销毁后会被设置为 nil，所以能在继续使用该属性时避免程序崩溃，一般用来修饰 delegate 对象和 IBOutlet 对象。

- unsafe_unretained：和 weak 相似，区别在于被销毁时不会置为 nil (unsafe)，它主要是为了兼容 4.0 系统而存在(iOS4 以及之前没有 weak)，由于 weak 会对性能有一点影响，因此对性能要求很高的地方可以考虑使用 unsafe_unretained 替换 weak

- copy：同 MRC 中的 copy 一样

- strong：同 MRC 中的 retain 一样

### runtime 是如何将 weak 对象设置为 nil?
weak 对象会被放入到一个 hash 表中，并用它指向的对象内存地址作为 key，所有指向它的 weak 指针以数组的形式作为 value，当此对象的 dealloc 方法被调用时，会用这个 key 将指向它的 weak 指针数组找出来，并将它们置为 nil，最后再从 weak hash 表中删除这条数据。

### 列出几种有问题的写法
当源字符串是 NSMutableString 类型时，strong 是浅拷贝，copy 才是深拷贝，所以 str 会随着源字符串的修改而变化

```
@property (nonatomic, strong) NSString *str;
```

当源字符串是 NSString 类型时，不管用 strong 还是 copy 都是浅拷贝，所以这里 str 指向的仍然是 NSString 对象，当用 str 调用 NSMutableString 类的 insert 等方法时会报错"找不到该方法"

```
@property (nonatomic, copy) NSMutableString *str;
```

MRC 下需要自己在 dealloc 中将 delegate 设置为 nil， ARC 下需要用 weak 修饰 delegate 属性

```
@property (nonatomic, assign) id delegate;
```

newString属性对应的 getter 也叫 newString，ARC下编译器不允许方法名以 alloc/init/new/copy/mutableCopy 开头，它会根据方法以什么开头来决定内存管理方式

```
@property (nonatomic, copy) NSString *newString;
```

# 循环引用
多个对象之间相互持有便会造成循环引用，从而导致 app 占用内存过高，通常打破它的方法就是将其中对象的引用关系设置为 weak，会造成循环引用的几种常见情况：

- NSTimer：初始化 timer 对象时会 strong 当前对象从而造成循环引用，当 repeat 为 NO 时 timer 执行完成后会自动调用 invalidate 方法打破循环引用，repeat 为 YES 时则需要根据业务逻辑在适当时候调用 invalidate

- Block：需要注意的是即使我们在 block 内部直接用 _username 这种方式引用实例变例 block 仍然会 retain self，另外需要知道的就是并不是所有 block 都会造成循环引用，只有在互相持有时才会。（例如 [UIView animateWithDuration: animations:] 就没问题）

- Delegate：delegate 属性要用 weak 修饰，使用 strong 会造成循环引用，使用 assgin 有可能会造成崩溃，需要注意的是 UIWebview 的 delegate 就是 assgin 的，所以需要我们自己将它设置为 nil。

- 自定义类之间的相互持有：这个其实才是最常见，并且最不容易被发现的，复杂些的是两个以上对象造成的相互持有，这种情况不容易被发现，可通过下面几种场景了解下
    - A -> B -> C 没问题，即使 A -> C 也没问题，因为没有 “环”
    - A -> B -> C -> A 都释放不了
    - A -> B -> C -> B 只有 A 能释放，这也说明了不在 “环” 里的对象就不受影响，可以从下面的例子中证明这一点，我们可以将 Parent 中的 son 设置为 weak 来打破循环引用

```swift
class Teacher {
    var stu: Student?

    deinit {
        print("Teacher deinit")
    }
}

class Student {
    var parent: Parent?

    deinit {
        print("Student deinit")
    }
}

class Parent {
    var son: Student?

    deinit {
        print("Parent deinit")
    }
}

let teacher = Teacher()
let student = Student()
let parent = Parent()
        
teacher.stu = student
student.parent = parent
parent.son = student
``` 

除了靠正确编写代码来避免循环引用，还可以通过腾讯推出的 MLeaksFinder 工具来检测已经发生循环引用的代码，MLeaksFinder 的主要优点在于使用简单，不侵入业务代码，并且能够在出现问题时准确告诉你哪个对象没被释放，更重要的是它能够检测出 Instrument 检测不出来的很多问题。

# AutoreleasePool
当不再使用一个对象时应该将其释放，但是在某些情况下，我们很难理清一个对象什么时候不再使用，Objc 提供的自动释放池可以解决这个问题，只需要给这种对象发送 autorelease 消息，就会将该对象放到池子里，当池子被清理时，会给池里所有的对象发送 release 消息。

每个 Runloop 在迭代时都会创建自动释放池，并在迭代后释放池子。如果是我们自己创建的池子，会在出了 @autoreleasepool 的大括号后进行清理。通常我们不用自己去创建池子，但是遇到循环次数较大时会导致内存占用不断增长，这时需要我们自己创建自动释放池。

```objc
for (int i = 0; i < 1000000; i ++) {
	@autoreleasepool {
		NSString *str = [NSString stringWithFormat:@"%d", i];
       
		NSLog(@"%@", str);
	}
}
```

PS: NSArray 的 enumerateObjectUsingBlock.... 中也有一个 AutoreleasePool

每个线程在维护自己的自动释放池时都会有一个或多个 AutoreleasePoolPage 对象，每个 Page 对象会开辟4096字节内存（虚拟内存一页的大小），它们之间以双向链表的形式组合而成，Page 对象通过 next 指针实现用栈的结构形式存储 autorelease 对象，next 指针会被初始化在栈底，当有 autorelease 对象入栈时，next 便会指向下一地址，当 Page 空间被占满便指向栈顶，这时如果再添加 autorelease 对象，便会交给新建的 Page 对象存储，并连接链表。

每添加一个 @autoreleasepool { ... } 相当于实现下面代码

```objc
// 会在现有 AutoreleasePoolPage 对象中添加一个哨兵对象(nil)用来标记位置，主要用于在释放池子时标记哪些 autorelease 对象需要释放
void *context = objc_autoreleasePoolPush(); 

...

// 给晚于哨兵对象后加入的所有 autorelease 对象发送 release 消息，并修改 next 指针，可以跨 Page（所以得用双向链表组合 Page 对象）
objc_autoreleasePoolPop(context); 
```

PS: 在添加 autorelease 对象时，如果发现线程没有 AutoreleasePoolPage 则会创建新的，所以不用担心子线程中没开启 Runloop 导致的内存泄露问题。

AutoreleasePoolPage 结构如下

```objc
class AutoreleasePoolPage {
    magic_t const magic;
    id *next; // 指向栈顶最新进来的 autorelease 对象的下一个位置
    pthread_t const thread; // 当前线程
    AutoreleasePoolPage * const parent; // 上一个 Page
    AutoreleasePoolPage *child; // 下一个 Page
    uint32_t const depth;
    uint32_t hiwat;
};
```

通过下面这张图可以更好的理解这些细节

![](/images/autorelease_pool.jpeg)

## Swift 中的内存管理
Swift 使用 ARC 机制来跟踪和管理内存，并且只针对拥有引用计数的 class 实例，和 OC 相似它有 strong、weak、unnowned 三个关键字，默认为 strong。Swift 可以通过弱引用和无主引用来解决循环引用问题，它们都允许循环引用中的一个实例强引用而另外一个实例不保持强引用。

### weak VS unowned
当可能造成循环引用的两个实例中的其中一个为可选类型，那么就将这个可能为 nil 的属性声明为 weak，相当于 OC 中的 __weak，它可以在这个属性释放时设置为 nil，所以不会导致 app 崩溃

```
weak var delegate: XXX?
``` 

当可能造成循环引用的两个实例有着几乎相同的生命周期，并且都不希望值为 nil 时，将有着强制依赖性的那个实例对另一个实例持有无主引用。ARC 无法在实例被销毁后将无主引用设为 nil，所以要小心无主引用实例释放后再次使用它时出现的运行时错误，unowned 相当于 OC 中的 __unsafe_unretained

```
unowned let timer: Timer
```

Swift 提供了闭包捕获列表来解决闭包引起的循环引用。捕获列表定义了闭包体内捕获一个或者多个引用类型的规则，跟解决两个类实例间的循环引用一样。

```objc
__weak typeof(self) weakSelf = self;

self.block = ^{
    __strong typeof(self) strongSelf = weakSelf;
    [strongSelf doSomething];
};
```

```swift
self.closure = { [weak self] in // 用 weak 而不是 unowned 会更安全些
    guard let strongSelf = self else { return } // 像 OC 一样
    strongSelf.doSomething() // 必须用 self 引用属性或方法
}
```

### struct VS class
首先我们要了解它们的区别：struct 是值类型，在栈中分配内存，访问控制是 public，class 是引用类型，在堆中分配内存，访问控制是 private 并且可以使用继承。

因为值类型在数据传递和拷贝时要比 class 安全，并且值类型所处的栈是线程独有的，所以不用考虑多线程问题，所以我们在使用时可以将存储数据的 model 类定义成 struct，而进行逻辑处理的类定义成 class。

```swift
class Student {
    var name: String
    init(name: String) {
        self.name = name
    }
}

var stu1 = Student(name: "Bob")
var stu2 = stu1
stu2.name = "Leo"

print(stu1.name) // "Leo" 如果将 class 改成 struct，则 stu1.name 会打出 Bob，通常这也是我们想要的结果。
print(stu2.name) // "Leo"
```

PS: 堆栈的区别以及 Swift 中的堆为什么要通过双向链表实现，可参考这篇[文章](https://www.jianshu.com/p/aca50c5a9d64)

### 内存对齐
Swift也有内存对齐的概念，使用内存对齐可以使 CPU 寻址更快从而提高访问速度。

```swift
struct St1 {
    var a: Int8 // 1 Bytes
    var b: Int32 // 4 Bytes
}

struct St2 {
    var a: Int32 // 4 Bytes
    var b: Int8 // 1 Bytes
}

let s1 = St1(a: 3, b: 3)
let s2 = St2(a: 3, b: 3)
        
print(MemoryLayout.size(ofValue: s1)) // 1 + 3 + 4 = 8 (3 是需要对齐的内存)
print(MemoryLayout.size(ofValue: s2)) // 4 + 1 = 5
```

所以 struct 和 class 中成员变量的声明顺序会影响它在内存中的占用空间，元素在放入内存时并不是紧密排列，而是从结构体存储的首地址开始，每一个元素放置到内存中时，它都会认为内存是以它自己的大小来划分的，因此元素放置的位置一定会在自己宽度的整数倍上开始，所以 St1 中 b 会从 4 开始。如果在 b 上面再定义一个 Int16 的变量，那么所需要的内存大小还是 8。

