---
title: "iOS 开发中的设计模式"
date: 2019-12-15 19:18:55 +0800
draft: true
---

设计模式是对软件开发设计中一些常见问题的解决方案，为了便于沟通，又给每种方案起了名字并归类，设计模式不局限于某种开发语言，也不局限于面向对象设计思想，它同样可应用于函数式开发和面向协议开发。

## 设计原则
其实我们在不知不觉时已经使用到了很多模式，在分别介绍它们前需要先了解下设计模式的六大原则和一个法则，制定这些原则的目的并不是要我们刻板的去遵守它们，而是要根据实际情况去灵活运用。

### 开闭原则
当程序需要新增功能时，不去修改原有的代码，而是通过新增代码的方式去做扩展，这样做可以避免影响到原功能，并且能够提高程序的稳定性和灵活性，易于维护和升级。

### 单一职责原则
单一职责的核心思想就是高内聚、低耦合，一个类或方法只做它该做的事情，这样做的好处是代码复杂性低、可维护性高，当代码发生变化时影响范围较小。

### 接口隔离原则
代码之间的依赖关系应该建立在已满足单一职责的接口上，并且不去依赖它不需要的接口，所以要避免出现庞大臃肿的接口，满足接口隔离原则可以降低代码耦合度，提高程序设计灵活性。

### 里氏替换原则
使用父类的地方必须能够使用其子类，但父类未必能胜任子类做的事情，如果子类不能完整地实现父类的方法，或者父类的某些方法在子类中已经发生“畸变”，则建议断开继承关系，改为通过依赖、聚合、组合等方式代替继承来实现代码的复用。

### 依赖倒置原则
程序要依赖于抽象（接口或抽象类）而不依赖于具体实现，抽象不应该关注细节，细节应该依赖于抽象，本质就是我们常说的面向接口编程。依赖倒置的好处是可以使各个类或模块彼此独立，互不影响，从而实现模块间的松耦合。在实际开发中的一个应用就是当我们在做组件化开发时，核心组件和功能组件不依赖于业务组件，不关心业务细节，业务组件可依赖于多个上层功能组件。

### 合成聚合复用原则
合成/聚合指在一个对象里面使用一些已有类的对象，使之成为自己的一部分来达到复用已有功能的目的，相对继承来说耦合性低一些，当只有“Is - A”才应该使用继承，“Has - A”应当使用聚合。

### 迪米特法则
迪米特法则又叫最少知识原则，一个对象应当对其他对象尽可能少的了解，也就是说要尽量少发布 public 的属性和方法，这样利于降低类与类之间的代码耦合度，在代码发生变更时影响范围较小，并且系统功能模块也会相对独立。

## 设计模式
设计模式可以根据其意图或目的分为创建型、结构型、行为型三类，分别关注创建对象、组合代码以及对象间的通信问题。

### 创建型设计模式（Creational Pattern）
创建型模式关注创建对象的机制，通过将对象的创建和使用分离来增加代码的灵活性和可复用性。包含简单工厂模式、工厂方法模式、抽象工厂模式、建造者模式、原型模式和单例模式。

#### 简单工厂模式（Simple Factory）
在工厂类中定义用于创建实例的静态方法，然后根据传入参数的不同返回不同实例，被创建的实例具有共同的父类或接口，调用处只关心要什么，不用关心其具体创建对象方式。

```swift
class MapFactory {
    static func getMap(_ type: MapType) -> Map {
        switch type {
        case .baidu:
            return BaiduMap()
        case .system:
            return SystemMap()
    }
} 

UIButton(type: .custom) 有点像
```

将对象的创建和对象本身业务处理分离可以降低系统的耦合度，使得两者修改起来都相对容易。简单工厂模式最大的问题在于工厂类的职责相对过重，增加新的产品（高德地图）需要修改工厂类的判断逻辑，这一点与开闭原则是相违背的。

#### 工厂方法模式（Factory Method）
工厂方法模式在简单工厂模式的基础上演变为抽象出一个工厂父类或接口，然后用不同的工厂子类来生成各自的产品。也就是说每个对象都有一个与之对应的工厂。

```swift
protocol MapFactory {
    func getMap() -> Map
}

class BaiduMapFactory: MapFactory {
    func getMap() -> Map {
        return BaiduMap()
    }
}

class SystemMapFactory: MapFactory {
    func getMap() -> Map {
        return SystemMap()
    }
}

let map = SystemMapFactory().getMap()
```

使用工厂方法模式在增加新产品（高德地图）时无须修改现有代码，，只需要为它创建一个具体类和对应的工厂类，这更符合“开闭原则”，但这样就需要创建新的子类，在一定程度上增加了系统的复杂性。 代码可能会因此变得更复杂。增加了系统的抽象性和理解难度

#### 抽象工厂模式（Abstract Factory）
抽象工厂模式是工厂模式的进一步深化，工厂方法模式只有一个抽象产品，而抽象工厂模式有多个抽象产品。抽象工厂模式里每个工厂都会生产多种产品，这是和工厂方法最大的不同点。

```swift
protocol MapFactory {
    func getMap() -> Map
}

// getLocation() 放到 MapFactory 里也可以
protocol LocationFactory {
    func getLocation() -> CLLocationCoordinate2D
}

class BaiduMapFactory: MapFactory, LocationFactory {
    func getMap() -> Map {
        return BaiduMap()
    }
    
    func getLocation() -> CLLocationCoordinate2D {
        return CLLocationCoordinate2D(latitude: 36.1111, longitude: 116.1111)
    }
}

let map = BaiduMapFactory().getMap()
let location = BaiduMapFactory().getLocation()
```

在增加新的产品时需要修改所有的工厂角色，包括抽象工厂类，在所有的工厂类中都需要增加生产新产品的方法，不能很好地支持“开闭原则”。

类集群（类簇）是一种将公共抽象父类下的许多私有具体子类组织在一起的体系结构。 抽象父类声明了创建其私有子类实例的方法。 父类根据调用的创建方法分配适当的具体子类的对象。 每个返回的对象可能属于不同的私有具体子类。

类簇是Foundation框架广泛使用的抽象工厂设计模式。OC中有哪些类簇呢？NSData、NSArray、NSDictionary、NSString、NSNumber等都是类簇。日常开发debug过程中我们可能会发现_NSCFString、__NSArrayI这样的类，其实这就是其类簇下面的私有子类

为了解决这个问题，NSArray和NSMutableArray作为公开抽象父类，抽象了array功能的接口，但是具体的实现则是通过私有的具体子类来实现。再结合抽象工厂设计模式，程序员就可以通过抽象父类引用而指向私有具体子类，由子类根据自身情况实现父类抽象的方法。这样接口十分简洁，框架底层子类变化时也不会影响到接口的变化，增强了接口稳定性。

NSNumber即可以看做是工厂类，也是抽象产品基类，而具体产品子类则是NSCFBoolean和NSCFNumber。

NSString *str = @"string 1";
NSLog(@"string 1 class : %@", [str class]);
NSString *str2 = [NSString stringWithUTF8String:"string 2"];
NSLog(@"string 2 class :%@", [str2 class]);

可以在控制台中看到以下日志:

string 1 class : __NSCFConstantString
string 2 class :NSTaggedPointerString


#### 建造者模式（Builder）
建造者模式可以通过一个独立的 Builder 类一步一步创建一个复杂的对象，它将复杂对象的创建步骤分解在不同的方法中，使用者不必知道复杂对象内部组成的细节，建造者模式将要构建的复杂对象本身与它的创建过程从业务逻辑代码中分离出来，使得相同的创建过程可以创建不同的复杂对象。缺点是由于该模式需要新增多个类， 因此代码整体复杂程度会有所增加。

下面例子中，菜单栏是一个复杂对象，它是由多个不同类型的菜单对象、菜单分组对象、分隔栏组成，不同 app 的菜单栏可以由不同菜单来组成，UIMenuBuilder 类可根据情况一步一步组装出 UIMenuBar。

```swift
override func buildMenu(with builder: UIMenuBuilder) {
        super.buildMenu(with: builder)

        let refreshMenu = UIMenu(title: "Refresh", ...)
        builder.insertChild(refreshMenu, atStartOfMenu: .file)

        let preferencesMenu = UIMenu(title: "Preferences...", ...)
        builder.insertSibling(preferencesMenu, atEndOfMenu: .about)
    }
```

#### 原型模式（Prototype）
原型模式可以将克隆对象的过程安排在对象所属类的内部完成，这样可以避免克隆操作会散落在各个业务代码中，并且解决无法克隆对象私有属性的问题，在多数情况下可被理解为一种深复制的行为

```swift
class Order: NSCopying {
    private var orderId: Int64?
    
    required init(orderId: Int64 = 0) {
        self.orderId = orderId
    }
    
    func copy(with zone: NSZone? = nil) -> Any {
        let obj = type(of: self).init()
        obj.orderId = orderId
        
        return obj
    }
}

let order2 = order1.copy()
```

#### 单例模式（Singleton）
能够保证一个类只有一个实例，并提供一个全局访问该实例的方式，当保持实例对象仅有一份是很有意义时，如 UIApplication UIScreen 在程序中只有一个。或者需要访问某些共享资源 （例如数据库或文件）时也可以使用单例模式，这样可以实现线程安全，避免线程同步问题，如 NSFileManager NSUserDefaults 。 

```swift
public class NetworkService {
    public static let shared = NetworkService()
    
    private init() { }
    
    public func download(_ url: String, finishedCallback: @escaping (_ success: Bool) -> Void = { _ in }) {
        
    }
}

NetworkService.shared.download("url...") { success in
    ...         
}
```

正确的使用单例模式能够节约系统资源，对于一些需要频繁创建和销毁的对象，单例模式无疑可以提高系统的性能。如果使用不当的话单例类很容易变得职责过重，违反单一职责原则，并且单例类比较不容易扩展，而且因为只有一个实例，所以不适合需要保存状态的场景。还要注意单例只有在程序被杀掉时才会释放，所以偶尔使用一次又很占内存的对象需要慎重考虑使用。
 
### 结构型设计模式
结构型模式关注如何将对象和类组装成较大的结构，并且能够保持结构的灵活性。包含适配器模式，组合模式、桥接模式、装饰模式、组合模式、外观（门面）模式、享元模式和代理模式。

#### 适配器模式（Adapter）
当我们需要电脑读取不同类型的存储卡时，读卡器就是电脑的适配器，适配器模式使接口不兼容的对象能够相互合作，它会接收对于一个对象的调用，并将其转换为另一个对象可识别的格式和接口，基于一些遗留代码的系统常常会使用该模式。 适配器可以使由于接口不兼容而不能交互的类可以一起工作。适配器模式灵活性和扩展性都非常好，通过使用配置文件，可以很方便地更换适配器，也可以在不修改原有代码的基础上增加新的适配器类，完全符合“开闭原则”。适配器模式会导致代码整体复杂度增加，因为你需要新增一系列接口和类。如果能够直接修改代码使其与其他代码兼容会更简单

例如 app 在获取到 json 格式数据后通过第三方库将其转为 Model 对象，当接口支持 protobuf 格式后，因为无法直接修改第三方库，所以我们可以定义一个适配器类，然后将 protobuf 转为 json 后再交给第三方库转成 Model 对象，适配器类只负责提供接口转换数据，不做别的事情。

设计模式是需要灵活使用的，并不一定只有接口不兼容而不能交互的类时才能使用适配器模式。


```swift
例如：Alamofire 提供了 RequestAdapter 类，支持在它提供的 adapter 方法里修改 request 对象，当你调用 session.request() 后 session 会去将 adapter 中设置的 request 对象 merge  request 
```

适配器模式通常在已有程序中使用， 让相互不兼容的类能很好地合作。
 
#### 桥接模式（Bridge）
当使用继承来解决某个问题时会导致产生无法控制数量的子类时，便可以考虑是否能够使用桥接模式，桥接模式将继承关系转换为关联关系，从而降低了类与类之间的耦合，减少了代码编写量。桥接模式还可以用来拆分或重组一个具有多重功能的庞杂类。

```swift
UIButton
@property(nonatomic,readonly) UIButtonType buttonType;
UISystemButton UIInfoLightButton UIInfoDarkButton UIPlainButton UIRoundedRectButton

上面是苹果做好的，当我们使用时需要满足换肤需求时，不应该为每种场景做个 Button，而是要建一个样式类，然后不同主题继承它，每个 Button 在不同主题下去使用主题样式即可。


另一种场景，如果在一个 button 类中有如下代码：根据不同主题加载样式，那么可以使用桥接模式将加载样式的代码拿出去（目前项目中用的 ColorButton 如果改成扩展 UIButton 添加类型，然后为每个类型写不同的 button 类，然后再通过某种方式应用，那么也可以算是使用了桥接模式）
```

#### 装饰模式（Decorator）
当需要动态地给对象添加一些职责时使用装饰器模式比使用子类更加灵活，松耦合，并且避免由于继承引起的代码复杂性；它允许向一个现有的对象添加新的功能，同时又不改变其结构。在 iOS 开发中扩展是苹果用装饰模式帮我们实现好的功能，它可以让你在不用继承的情况下，给已存在的类、结构体或者枚举类添加一些新的功能。

```swift
ext
```
穿衣服是使用装饰的一个例子。 觉得冷时， 你可以穿一件毛衣。 如果穿毛衣还觉得冷， 你可以再套上一件夹克。 如果遇到下雨， 你还可以再穿一件雨衣。 所有这些衣物都 “扩展” 了你的基本行为， 但它们并不是你的一部分， 如果你不再需要某件衣物， 可以方便地随时脱掉。

#### 组合模式（Composite）
组合模式可以将对象组合成树状结构，树的父节点和子节点具有相同的类型，相同的接口，可以像使用独立对象一样使用它们，组合模式以递归方式处理对象树中的所有项目。该模式的最大优点在于客户端可以统一的使用树状结构中的组合对象和单个对象，并且可以很容易在组合体内加入同类型的单个对象.


```swift
在Cocoa Touch框架中，UIView对象被组合成一个树形结构，UIView对象可以包含其他的UIView对象。这种组合方式便于统一用于事件处理，例如处理渲染事件时，事件会在父视图中被处理，然后在传递给子视图，因为他们都是相同的类型，事件可以传递到树形结构的每一视图。

addSubview  hitTest layoutSubviews
```

#### 外观（门面）模式（Facade）
外观模式在复杂的业务系统上提供了简单的接口，降低了系统的复杂程度。如果直接把业务的所有接口直接暴露给使用者，使用者需要单独面对这一大堆复杂的接口，学习成本很高，而且存在误用的隐患。如果使用外观模式，我们只要暴露必要的 API 就可以了。外观模式把使用和背后的实现逻辑成功解耦，同时也降低了外部代码对内部工作的依赖程度。如果底层的类发生了改变，外观的接口并不需要做修改。


```swift
例：NetworkService.get() 发起网络请求，根据不同环境选择不同域名，在httpHeader中添加签名信息，域名用http/https都不需要关心，这些东西变了后，调用处不用修改
```

报团旅游，只需要对接导游，不用自己去联系交通工具、预定旅馆、饭馆、景点门票等

#### 享元模式（Flyweight）
享元模式的目的是通过共享已存在的对象，减少创建对象内存开销，当存在可以复用的对象时不再创建新的对象。在享元模式中通常会出现工厂模式，享元工厂类的作用在于提供一个用于存储享元对象的享元池，用户需要对象时，首先从享元池中获取，如果享元池中不存在，则创建一个新的享元对象返回给用户，并在享元池中保存该新增对象。


```swift
UITableView 的 Cell 重用机制
通过管理 cell 队列，根据是否显示在屏幕上设置不同状态，当需要新 cell 时不重新生成，而是获取不显示在屏幕上的那个 cell
```

#### 代理模式（Proxy）
当一个类的对象不想或不能直接引用另一个对象时，可以通过“代理对象”来作为中介者完成想要做的事情，代理对象可以在只有实际需要时才创建，以便在某种场景下节约系统资源，代理模式可以有效降低系统的耦合度，在 iOS 开发中代理模式应用非常广泛，常用于参数传递和事件监听，当从 A 页面跳转到 B 页面，然后在 B 页面发生相关事件时需要 A 页面即时更新，就可以通过代理模式来实现，系统也提供了很多基于代理模式实现的 API，


```swift
例如 UITableViewDelegate、UIScrollViewDelegate等。
```

### 行为型设计模式
行为型设计模式主要关注对象之间的通信。包含责任链模式、命令模式、迭代器模式、中介者模式、备忘录模式、观察者模式、访问者模式、策略模式、状态模式和模板方法模式。

#### 责任链模式（Chain Of Responsibilities）
责任链模式可以把程序事件的发送者和接收者进行解耦合，发送方只需把事件消息发送出去即可，接收者负责对事件进行处理，事件有不止一个可处理它的对象，它们形成一个响应链，它将事件沿着处理者链进行发送。响应链收到请求后，每个处理者均可对请求进行处理，或自己不处理而是将其传递给链上的下个处理者。还可以动态在链上增加处理者，缺点是不容易调试。

iOS 的事件响应链还稍复杂一些，它是先一步一步找到可以最优先响应的视图对象，然后再反向寻找这条链上的哪个对象可以处理事件

```swift
与用户交互的对象（如Application, Window, View, ViewController）都是 NSResponder/UIResponder 的子类。
首先确定 first responder (触摸事件采用 Hit-Test)，随后 responder 

决定是否处理事件或通过 nextResponder 继续传递。

响应链 UIView pointInside  hitTest firstresponse  nextresponse
UIEvent
```

#### 命令模式（Command）
命令模式的本质是对事件进行封装，将事件的发送者和接收者完全解耦。发送请求的对象只需要知道如何发送请求，而不必知道如何完成请求，接收者也仅需要关心如果执行而不用关系是谁发来的请求，命令对象通常以数组的形式组合到一起，并支持添加和删除等操作。

电视机通过遥控器来切换节目就是典型的命令模式的应用，遥控器作为发送者负责发送“开机”、“换台”、“调声音”等命令，电视机作为接收者来响应相关操作，在 iOS 中 Target-Action 由命令模式实现

```swift
UIButton 负责绘制控件，并触发命令、UIControl 通过 targetActions 数组管理所有命令对象（由 target,action,event 组成），当命令被触发时由 self 也可以是别的对象来作为接收者来执行命令

let button = UIButton(frame: .zero)
button.addTarget(self, action: #selector(onClick), for: .touchUpInside)
button.addTarget(self, action: #selector(touchCancel), for: .touchCancel)
```

#### 迭代器模式（Iterator）
迭代器模式能在不暴露集合底层表现形式（列表、栈和树等）的情况下遍历集合中所有的元素。它的主要思想是将集合的遍历行为抽取为单独的迭代器对象。迭代器通常会提供一个获取集合元素的基本方法。 客户端可不断调用该方法直至它不返回任何内容，就意味着迭代器已经遍历了所有元素。

迭代器可以对同一数据类型提供多种遍历方式，比如说对有序列表，我们可以根据需要提供正序遍历，倒序遍历两种迭代器，用户用起来只需要得到我们实现好的迭代器，就可以方便的对集合进行遍历了。用户只需要得到迭代器就可以遍历，而对于遍历算法则不用去关心。大多数语言在实现集合时都给提供了迭代器，通常情况下我们不需要自己去实践迭代器模式。

```swift
NSFastEnumeration 协议定义规则，NSArray、NSDictionary 等类确认后并实现相关方法，然后就可以通过 enumerateKeysAndObjectsWithOptions 来遍历了。也可以通过集合对象来调用 objectEnumerator 生成 NSEnumerator 类型的迭代器对象，然后通过迭代器对象的 nextObject 方法遍历集合，直到返回 nil。苹果推荐使用 NSFastEnumeration，速度更快，效率高。

NSEnumerator *objEnumer = [dic objectEnumerator];
       
    id obj = nil;
    while (obj = [objEnumer nextObject]) {
        NSLog(@"%@", obj);
    }
```

#### 中介者模式（Mediator）
中介者模式让程序组件通过中介者对象进行间接沟通，达到减少组件之间依赖关系的目的，以做到松耦合。中介者能使得程序更易于修改和扩展，而且能更方便地对独立的组件进行复用，因为它们都是独立的，不再依赖于很多其他的组件，当组件或对象之间相互关联并相互依赖时，若对象发生变化，还需要考虑是否影响到其它对象，并且这个对象的重用性也会比较差，如果没有其他对象的支持，这个对象很难被别的模块重用。中介者模式能让你减少对象之间混乱无序的依赖关系。该模式会限制对象之间的直接交互，迫使它们通过一个中介者对象进行合作。

MVC中的C(controller)就是一个中介者，它的作用就是把M和V隔离开，协调M和V协同工作，把M运行的结果和V代表的视图融合成一个前端可以展示的页面，减少M和V的依赖关系。

```swift
组件之间的路由跳转通过 router 来实现，松耦合 
```

代理模式是一对一，中介者模式则是一对多

#### 备忘录模式（Memento）
当你需要创建对象状态快照来恢复其之前的状态时，可以使用备忘录模式，它不会打破对象的封装性，私有数据仍然是私有的。游戏中的存档以及数据库的回滚操作和编辑器中的撤消息操作都是通过备忘录模式实现的。但要注意操作记录过多时的资源消耗问题，所以要将太久前的操作转为磁盘存储，近期操作为内存存储，提高读取效率。

```swift
下面例子可用于重新打开 app 时根据对象内存恢复某种状态的功能。

苹果通过归档的方法来实现备忘录模式。它把对象转化成了流然后在不暴露内部属性的情况下存储数据。
首先，我们实现 NSCoding 协议，声明这个类是可被归档的。然后添加如下的两个方法：
required init(coder decoder: NSCoder) {
    super.init()
    self.title = decoder.decodeObjectForKey("title") as String?
    self.coverUrl = decoder.decodeObjectForKey("cover_url") as String?
}

func encodeWithCoder(aCoder: NSCoder) {
    aCoder.encodeObject(title, forKey: "title")
    aCoder.encodeObject(coverUrl, forKey: "cover_url")
}

var filename = NSHomeDirectory().stringByAppendingString("/Documents/albums.bin")
    let data = NSKeyedArchiver.archivedDataWithRootObject(albums)
    data.writeToFile(filename, atomically: true)
    
    NSKeyedUnarchiver 从归档文件加载数据
    
nsuserdefault 不算备忘录模式，因为它存储不了对象
```

#### 观察者模式（Observer）
观察者模式实现了一种订阅机制，可在对象事件发生时通知多个“观察”该对象的其他对象。它实现表示层和数据逻辑层的分离，并且实现了观察者和订阅者的解耦。需要注意的是订阅者的通知顺序通常是随机的。

```swift
Cocoa 使用两种方式实现了观察者模式： Notification 和 Key-Value Observing (KVO)。 RxSwift

Notification通知中心，注册通知中心，任何位置可以发送消息，注册观察者的对象可以接收，但无法按注册顺序保证接收顺序。
```

#### 访问者模式（Visitor）
当一个复杂的对象结构包含很多其他的对象，每个对象都有不同的接口，这个时候如果想添加新的接口进行新的操作，就得修改该对象的类，如果每个对象都需要添加新操作，就需要修改更多的类。如果这些新增接口跟这些对象在业务上相关性不是很大时，比较适合使用访问者模式处理，通过定义访问者类，然后将对每个对象新增接口方法，集中管理，如果以后要扩展新的接口方法时通常会再定义新的访问者类。这样的好处是可以使原来这些对象的类能够更专注于主要工作，访问者模式允许你在不修改已有代码的情况下向已有类层次结构中增加新的行为。

访问者模式适用于数据结构相对稳定的系统，它把数据结构和作用于数据结构上的操作之间的耦合解脱开，如果频繁变化，那么访问者类也需要频繁修改，这样就意义不大了。

例：一个对象中有不同业务的数据集，现在想要把不同业务的数据集内容转成柱状图。。。，如果是扩展对象所在类，或者扩展不同业务数据集所属对象的类都不合适，需要修改很多类，而且如果以后要加饼图时，还要再改一次，这时定义个访问者类，然后在里面定义对不同数据集转柱图的方法，如果以后加饼图，可以再加一个访问者

#### 策略模式（Strategy）
完成一项任务，往往可以有多种不同的方式，每一种方式称为一个策略，我们可以根据环境或者条件的不同选择不同的策略来完成该项任务。策略模式让算法独立于使用它的客户，并且可以避免把复杂的、与算法相关的数据结构暴露给客户端。策略模式提供了对“开闭原则”的完美支持，用户可以在不修改原有系统的基础上选择算法或行为，也可以灵活地增加新的算法或行为。使用策略模式可以避免使用多重条件转移语句。策略模式的缺点：策略模式将造成产生很多策略类，客户端必须知道所有的策略类，并自行决定使用哪一个策略类。
 
排序算法，NSArray的sortedArrayUsingSelector；
ary 只需要指定是要用倒序或正序，sort 内部会调用不同的排序实现类，sort 将复杂的算法封装起来。将算法的实现和使用算法的代码隔离开来，我们甚至可以在运行时动态指定要用哪种排序方式。 

策略模式另一种应用场景是解决多 if-else 问题，一个类在其操作中使用多个条件语句来定义许多行为，我们可以把相关的条件分支移动到它们自己的策略类中。

```swift
- (void)textFieldDidEndEditing:(UITextField *)textField {
    if (textField == phoneNumberTextField) {
        // 验证其值是个手机号
    }else if (textField == self.captchaTextField) {
        // 验证其值只包含数字，并且只有 6 位
    }
}

phoneNumberTextField.type = .phoneNumber
captchaTextField.type = .captcha

- (void)textFieldDidEndEditing:(UITextField *)textField {
    textField.validate() // validate 为扩展方法，在这里根据扩展字段 "type" 来做处理，不过这样只是将 if-else 移到了 validate() 里，在这里根据 type 分别调用工具类提供的不同的校验方法，要彻底不用 if-else ，则需要分别创建不同的校验类，例：PhoneNumberValidate、CaptchaValidate，它们确认同一协议 InputValidate 并实现 validate 方法，UITextField 需要扩展的字段就不能是简单的 enum 类型，而是 InputValidate 类型的字段，然后
    
    phoneNumberTextField.type = PhoneNumberValidate()
    captchaTextField.type = CaptchaValidate()
}
```

PS：目前项目里的支付功能用的就算是策略模式

#### 状态模式（State）
状态模式允许对象在其内部状态改变时改变它的行为，状态模式看起来和策略模式比较相像，状态模式建议为对象的所有可能状态新建一个类，然后将所有状态的对应行为抽取到这些类中。
 
以下两种情况下均可使用状态模式:

- 一个对象的行为取决于它的状态, 并且它必须在运行时刻根据状态改变它的行为。
- 代码中包含大量与对象状态有关的条件语句

状态模式与策略模式区别主要在于策略模式通过外界注入实现不同的算法，状态模式是根据内部状态的改变来切换不同算法，并且在状态模式中， 特定状态知道其他所有状态的存在， 且能触发从一个状态到另一个状态的转换； 策略则几乎完全不知道其他策略的存在。

状态模式和策略模式一样，在使用时必然会增加系统类和对象的个数。并且结构与实现都较为复杂，如果使用不当将导致程序结构和代码的混乱。

#### 模板方法模式（Template Method）
模版方法模式在基类中定义了一个算法的框架，将不变的行为抽离封装起来以去除重复代码，然后允许子类在不修改结构的情况下重写算法的特定步骤，并可以扩展新的行为。模板方法将整个算法转换为一系列独立的步骤，当你只希望客户端扩展某个特定算法步骤， 而不是整个算法或其结构时， 可使用模板方法模式。

```swift
继承 UIViewController 后通过重写 viewDidLoad  viewDidAppear 继承 UIView 重写 layoutSubviews...
```


> 正确合理的使用设计模式可以使代码变得更加简洁，并易于维护和扩展，不合理的使用会增加代码复杂度并导致代码混乱，增加维护成本，所以我们在设计开发时不要过度设计。设计原则、设计模式是前辈总结的"经验"，但不是"条款"，尽可能遵循这些规范会让你的设计无限接近完美，但世界上本就没有十全十美的东西，凡事都要有个度，不要认死理，不要为了"套模式"而应用设计模式，要具体问题具体分析，根据实际情况进行权衡。

