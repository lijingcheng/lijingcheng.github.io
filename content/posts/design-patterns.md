---
title: "iOS 开发中的设计模式"
date: 2019-12-20 14:18:55 +0800
draft: true
---

1994 年被称为四人帮（Gang of Four）的 Erich Gamma、Richard Helm、Ralph Johnson、John Vlissides 四位作者发表了一本名为《Design Patterns: Elements of Reusable Object-Oriented Software》的书，据说是由他们首次在书里提出了设计模式的概念，书中收录了 23 种设计模式。

设计模式是对软件开发设计中一些常见问题的解决方案，为了便于沟通，又给每种方案起了名字并归类，设计模式不局限于某种开发语言，也不局限于面向对象设计思想，它同样可应用于函数式开发和面向协议开发。

# 设计原则
其实我们在不知不觉时已经使用到了很多模式，在分别介绍它们前需要先了解下设计模式的六大原则和一个法则，制定这些原则的目的并不是要我们刻板的去遵守它们，而是要根据实际情况去灵活运用。

### 开闭原则
当程序需要新增功能时，不去修改原有的代码，而是通过新增代码的方式去做扩展，这样做可以避免影响到原有功能，并且能够提高程序的稳定性和灵活性，易于维护和升级。

### 单一职责原则
单一职责的核心思想就是高内聚、低耦合，一个类或方法只做它该做的事情，这样做的好处是代码复杂性低、可维护性高，当代码发生变化时影响范围较小。

### 接口隔离原则
代码之间的依赖关系应该建立在已满足单一职责的接口上，并且不去依赖它不需要的接口，所以要避免出现庞大臃肿的接口，满足接口隔离原则可以降低代码耦合度，提高程序设计灵活性。

### 里氏替换原则
使用父类的地方必须能够使用其子类，但父类未必能胜任子类做的事情，如果子类不能完整地实现父类的方法，或者父类的某些方法在子类中已经发生“畸变”，则建议断开继承关系，改为通过依赖、聚合、组合等方式来实现代码的复用。

### 依赖倒置原则
程序要依赖于抽象（接口或抽象类）而不依赖于具体实现，抽象不应该关注细节，细节应该依赖于抽象，本质就是我们常说的面向接口编程。依赖倒置的好处是可以使各个类或模块彼此独立，互不影响，从而实现模块间的松耦合。在实际开发中的一个应用就是当我们在做组件化开发时，核心组件和功能组件不依赖于业务组件，不关心业务细节，业务组件可依赖于多个上层功能组件。

### 合成聚合复用原则
合成/聚合指在一个对象里面使用一些已有类的对象，使之成为自己的一部分来达到复用已有功能的目的，相对继承来说耦合性低一些，当只有“Is - A”才应该使用继承，“Has - A”应当使用聚合。

### 迪米特法则
迪米特法则又叫最少知识原则，一个对象应当对其他对象尽可能少的了解，也就是说要尽量少发布 public 的属性和方法，这样利于降低类与类之间的代码耦合度，在代码发生变更时影响范围较小，并且系统功能模块也会相对独立。

# 设计模式
设计模式可以根据其意图或目的分为创建型、结构型、行为型三类，分别关注创建对象、组合代码和对象间的通信问题。

## 创建型设计模式
创建型模式关注创建对象的机制，通过将对象的创建和使用分离来增加代码的灵活性和可复用性。包含简单工厂模式、工厂方法模式、抽象工厂模式、建造者模式、原型模式和单例模式。

### 简单工厂模式（Simple Factory）
在工厂类中定义用于创建实例的静态方法，然后根据传入参数的不同返回不同实例，被创建的实例具有共同的父类或接口，调用处只关心要什么，不用关心具体创建方式。

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
```

将对象的创建和对象本身业务处理分离可以降低系统的耦合度，使得两者修改起来都相对容易。简单工厂模式最大的问题在于工厂类的职责相对过重，增加新的产品（高德地图）需要修改工厂类的判断逻辑，这一点与开闭原则是相违背的。

### 工厂方法模式（Factory Method）
工厂方法模式在简单工厂模式的基础上演变为抽象出一个工厂父类或接口，然后用不同的工厂子类来生成各自的产品，也就是说每个对象都有一个与之对应的工厂。

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

let map = BaiduMapFactory().getMap()
```

使用工厂方法模式在增加新产品（高德地图）时无须修改现有代码，只需要为它创建一个具体类和对应的工厂类，这更符合“开闭原则”，但这样就需要创建新的子类，在一定程度上增加了系统的复杂性。

### 抽象工厂模式（Abstract Factory）
抽象工厂模式是工厂模式的进一步深化，工厂方法模式只有一个抽象产品，而抽象工厂模式有多个抽象产品，并且每个抽象工厂都会生产多种产品，这是和工厂方法最大的不同点。

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

在增加新的产品时需要修改所有的工厂角色，包括抽象工厂类，在所有的工厂类中都需要增加生产新产品的方法，抽象工厂模式不能很好地支持“开闭原则”。

Foundation 框架中广泛使用的类簇是一种将公共抽象父类下的许多私有子类组织在一起的体系结构。抽象父类声明了创建其私有子类实例的方法，并根据传入参数来选择用哪个具体子类来创建对象。常见类簇有 NSData、NSArray、NSDictionary、NSString、NSNumber，它们作为抽象父类存在，我们在 debug 时见到的 NSCFBoolean 和 NSCFNumber 就是 NSNumber 的私有子类，抽象父类定义接口后由私有子类负责实现。这样设计的最大好处是框架底层子类变化时不会影响到接口的变化，增强了接口稳定性。

### 建造者模式（Builder）
建造者模式可以通过一个独立的 Builder 类一步一步创建一个复杂的对象，它将复杂对象的创建步骤分解在不同的方法中，使用者不必知道复杂对象内部组成的细节，建造者模式把要构建的复杂对象本身与它的创建过程从业务逻辑代码中分离出来，使得相同的创建过程可以创建不同的复杂对象。缺点是由于该模式需要新增多个类，因此代码整体复杂程度会有所增加。

下面例子中，菜单栏是一个复杂对象，它是由多个不同类型的菜单对象、菜单分组对象、分隔栏组成，不同 app 的菜单栏可以由不同菜单组成，UIMenuBuilder 类可根据情况一步一步组装出 UIMenuBar。

```swift
override func buildMenu(with builder: UIMenuBuilder) {
    super.buildMenu(with: builder)

    let refreshMenu = UIMenu(title: "Refresh", ...)
    builder.insertChild(refreshMenu, atStartOfMenu: .file)

    let preferencesMenu = UIMenu(title: "Preferences...", ...)
    builder.insertSibling(preferencesMenu, atEndOfMenu: .about)
}
```

### 原型模式（Prototype）
原型模式可以将克隆对象的过程安排在对象所属类的内部完成，这样可以避免克隆操作散落在各个业务代码中，并且解决无法克隆对象私有属性的问题，在多数情况下可被理解为一种深复制的行为。

```swift
class Order: NSCopying {
    private var orderId: Int64?
    
    required init(orderId: Int64?) {
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

### 单例模式（Singleton）
能够保证一个类只有一个实例，并提供一个全局访问该实例的方式，当保持实例对象仅有一份是有必要的，或者实例需要访问某些共享资源时可以考虑使用单例模式，这样可以实现线程安全，避免线程同步问题，iOS 开发中常见的单例类有 NSFileManager、UIApplication、NSUserDefaults 等。

```swift
public class Network {
    public static let shared = Network()
    
    private init() { }
    
    public func download(_ url: String, finishedCallback: @escaping (_ success: Bool) -> Void = { _ in }) {
        
    }
}

Network.shared.download("url") { success in
    ...
}
```

正确的使用单例模式能够节约系统资源，对于一些需要频繁创建和销毁的对象，单例模式无疑可以提高系统的性能。如果使用不当的话单例类很容易变得职责过重，违反单一职责原则，并且单例类比较不容易扩展，因为只有一个实例，所以不适合需要保存实例状态的场景。还要注意单例只有在程序被杀掉时才会释放，所以偶尔使用一次又很占内存的对象需要慎重考虑使用。
 
## 结构型设计模式
结构型模式关注如何将对象和类组装成较大的结构，并且能够保持结构的灵活性。包含适配器模式，组合模式、桥接模式、装饰模式、组合模式、外观（门面）模式、享元模式和代理模式。

### 适配器模式（Adapter）
现实生活中当我们需要电脑读取不同类型的存储卡时，读卡器就是存储卡和电脑之间的适配器。适配器模式通常在已有程序中使用，它可以在不修改原有代码的基础上让相互不兼容的类能够很好地合作，完全符合“开闭原则”，下面通过两个例子介绍下适配器模式的使用。

1. App 在拿到接口返回的 JSON 格式数据后会通过第三方库将其转为 Model 对象供业务类使用，当有一天接口支持返回 Protobuf 格式数据后，因为无法直接修改 JSON 转 Model 的第三方库，所以我们可以定义一个适配器类，将收到的 Protobuf 数据转为 JSON 后再交给第三方库，适配器类只负责提供接口转换数据，不做别的事情。
2. Alamofire 提供的 RequestAdapter 类就是适配器模式的一个应用，我们可以通过它来给 request 对象添加 cookie 或 header，Alamofire 在发起网络请求前会将它自己对 request 对象的设置和我们通过 adapter 对 request 对象的设置做 merge 操作后再发起请求。

```swift
class APIAdapter: RequestAdapter {
    func adapt(_ urlRequest: URLRequest, completion: @escaping (Result<URLRequest>) -> Void) {
        var request = urlRequest

        request.setValue(xxx, forHTTPHeaderField: "SignString")
        request.setValue(request.url?.host, forHTTPHeaderField: "Host")
        request.setValue("gzip;q=1.0, compress;q=0.5", forHTTPHeaderField: "Accept-Encoding")

        completion(.success(request))
    }
}

let session = Session(configuration: configuration, adapter: APIAdapter())
session.request(request).validate().responseJSON { response in
    ...
}

// session.request() 会在其调用的 performSetupOperations 方法中读取 adapter 修改的 request 对象并与默认 request 对象做合并操作（下面方法已移除无关代码）
func performSetupOperations(for request: Request, convertible: URLRequestConvertible) {
    if let adapter = adapter {
        adapter.adapt(initialRequest) { (result) in
            let adaptedRequest = try result.unwrap()
            self.rootQueue.async {
                request.didAdaptInitialRequest(initialRequest, to: adaptedRequest)
                self.didCreateURLRequest(adaptedRequest, for: request)
            }
        }
    } else {
        rootQueue.async { self.didCreateURLRequest(initialRequest, for: request) }
    }
}
```

适配器模式灵活性和扩展性都非常好，但是会导致代码整体复杂度增加，因为你需要新增一系列接口和类来做数据或接口的转换，所以在能够直接修改原有代码的场景下尽量不去使用适配器模式。
 
### 桥接模式（Bridge）
当使用继承来解决某个问题时会导致产生很多子类时，便可以考虑是否能够使用桥接模式，桥接模式可以将继承关系转换为关联关系，从而降低了类与类之间的耦合，减少了代码编写量，桥接模式还可以用来拆分或重组一个具有多重功能的庞杂类。

UIKit 提供的 UIButton 类有多种默认样式，包括 system、infoLight、infoDark、plain、roundedRect 等，如果分别提供相关子类会导致 UIButton 控件使用的复杂性，并且灵活性也不好，所以 UIButton 对开发者提供了 buttonType 属性控制样式，并且内部也并没有用继承的方式实现多个子类。


```swift
UIButton(type: .system)
```

### 装饰模式（Decorator）
当天气变冷时你可以穿上一件毛衣，如果还觉得冷，可以再套上一件夹克，如果遇到下雨，还可以再外面再穿上一件雨衣，所有这些衣物都“扩展”了你自己，但衣服并不是你的一部分，如果不需要这些衣服时可以很方便的脱掉，这就是现实生活中的装饰模式。

装饰模式允许向一个现有的对象添加新的功能，同时又不改变其结构，当需要动态地给对象添加一些职责时使用装饰器模式比使用子类更加灵活，它不仅松耦合而且可以避免由于继承引起的代码复杂性。在 iOS 开发中扩展是苹果用装饰模式帮我们实现好的功能，它可以让你在不使用继承的情况下，给已存在的类、结构体或者枚举添加一些新的功能。

```swift
extension Dictionary {
    public func toJSON() -> Data? {
        ...
    }
}
```

### 组合模式（Composite）
组合模式可以将对象组合成树状结构，树的父节点和子节点具有相同的类型，相同的接口，可以像使用独立对象一样使用它们，组合模式以递归方式处理对象树中的所有项目，它最大的优点在于可以用统一的方式使用树状结构中的组合对象和单个对象，并且可以很容易的在组合体内加入同类型的单个对象。

UIView 对象就是被组合成一个树形结构，它可以包含其他的 UIView 对象，这种组合方式便于统一处理事件，例如在做界面渲染时，事件会在父视图中被处理，然后再传递给子视图，因为他们都是相同的类型，所以事件可以很方便的传递到树形结构中的每一个视图。

```swift
class TestView: UIView {
    override init(frame: CGRect) {
        super.init(frame: frame)
        
        addSubview(contentView) // 向树性结构中添加结点，contentView 还可以作为父结点添加新的子结点
    }

    // TestView 被触发要调整 frame 时，会通过 layoutSubviews 来调整子视图的 frame
    override func layoutSubviews() {
        super.layoutSubviews()

        contentView.frame = .zero
    }
}
```

### 外观（门面）模式（Facade）
外观模式在复杂的业务系统上仅提供必要的 API，这样不仅降低了系统的复杂度，同时也降低了代码间的依赖度，当底层的类发生改变时接口并不需要做修改，如果把所有接口都暴露给使用者，不仅学习成本高，而且存在误用的隐患。在现实生活中当我们选择报团旅游时，只需要对接导游，不用自己去购买交通工具的票，也不用自己去预定旅馆、饭馆、购买景点门票等，这些也是外观模式的应用。

在项目中发起一个网络请求时，只需要指定接口和业务类型，get 方法会以 GET 方式发起请求，并调用卡业务所在域名，同时会设置 header、添加签名、Cookie 等内容，调用方不用关注这些细节，当需要修改 header 或添加其它内容时，不会影响业务代码。

```swift
Network.get("xxx.api", type: .card)
```

### 享元模式（Flyweight）
享元模式的目的是通过共享已存在的对象，减少创建对象所产生的内存开销，在享元模式中通常会出现工厂模式，享元工厂类会提供一个用于存储对象的池子，当用户需要对象时，首先从池中获取，如果不存在则创建新对象返回给用户，并保存到池子里。

```swift
func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
    let cell = tableView.dequeueReusableCell(withIdentifier: "reuseIdentifier") as? Cell
        
    return cell!
}
```

### 代理模式（Proxy）
当一个类的对象不想或不能直接引用另一个对象时，可以通过“代理对象”来作为中介者完成想要做的事情，代理对象可以在只有实际需要时才创建，以便在某种场景下节约系统资源，代理模式可以有效降低系统的耦合度，在 iOS 开发中代理模式应用非常广泛，常用于数据和事件的传递，当从 A 页面跳转到 B 页面，然后在 B 页面发生相关事件时需要 A 页面即时更新，就可以通过代理模式来实现，系统也提供了很多基于代理模式实现的 API。

```swift
class ViewController: UITableViewDelegate, UITableViewDataSource {
    override public func viewDidLoad() {
        super.viewDidLoad()

        tableView.delegate = self
        tableView.dataSource = self
    }
    
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return 3
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "reuseIdentifier") as? Cell

        return cell!
    }
}
```

## 行为型设计模式
行为型设计模式主要关注对象之间的通信，包含责任链模式、命令模式、迭代器模式、中介者模式、备忘录模式、观察者模式、访问者模式、策略模式、状态模式和模板方法模式。

### 责任链模式（Chain Of Responsibilities）
责任链模式可以把程序事件的发送者和接收者解耦合，发送方只需把事件消息发送出去，接收者负责对事件进行处理，并且事件可以有不止一个可处理它的对象，这些对象会形成一个响应链，事件沿着响应链进行传递，链条上的每个处理者都可以对事件进行处理，或者将其传递给链上的下个处理者，甚至还可以动态在链上增加处理者，缺点是不容易调试。

iOS 的事件响应链还稍复杂一些，它是先一步一步找到可以最优先响应的视图对象，然后再反向寻找这条链上的哪个对象可以处理事件，我们平时常用的 View 和 ViewController 都继承自能够提供事件响应及传递事件功能的 UIResponder 类。

下面通过一个例子看下责任链模式在 iOS 中的应用，该例子实现的功能是在当子视图添加到父视图后，默认情况下其响应事件的范围就是父视图的 bounds，如果部分界面超出了这个范围，则超出部分无法响应事件，未超出部分仍然可以响应事件，为了使超出父视图范围的子视图也能响应事件，需要实现主视图的 - hitTest:withEvent: 方法，并想办法返回这个子视图来作为事件的响应者。

```swift
// hitTest 方法返回的视图会作为响应者来处理事件，如果返回 nil，则事件会传递给下一响应者
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

### 命令模式（Command）
命令模式的本质是对事件进行封装，将事件的发送者和接收者完全解耦，发送事件的对象只需要知道如何发送，而不必知道收到事件后如何处理，接收者也仅需要关心如何处理事件，而不用关心是谁发送的，命令对象通常以数组的形式组合到一起，并支持添加和删除等操作。现实生活中电视机通过遥控器来切换节目就是典型的命令模式的应用，遥控器作为发送者负责发送“开机”、“换台”、“调声音”等命令，电视机作为接收者来响应相关操作。

在 iOS 中 Target-Action 机制是命令模式的一个应用，UIButton 继承自 UIControl，UIButton 负责绘制控件并触发命令，UIControl 通过 targetActions 数组管理所有命令对象，每个命令对象由 target、action、event 组成，当命令被触发时由 self 或其它对象作为接收者来执行命令。

```swift
let button = UIButton(frame: .zero)
button.addTarget(self, action: #selector(onClick), for: .touchUpInside)
button.addTarget(self, action: #selector(touchCancel), for: .touchCancel)
```

### 迭代器模式（Iterator）
迭代器模式能在不暴露集合底层表现形式（列表、栈和树等）的情况下遍历集合中所有的元素，它将集合的遍历行为抽取为单独的迭代器对象，迭代器通常会提供一个获取集合元素的基本方法，我们可不断调用该方法直至它不返回任何内容，就意味着迭代器已经遍历了所有元素。迭代器可以对同一数据类型提供多种遍历方式，比如说对有序列表就可以有正序遍历和倒序遍历两种迭代器，大多数语言在实现集合时都提供了迭代器，通常情况下我们不需要自己去实现。

在 iOS 中由 NSFastEnumeration 协议定义规则，NSArray、NSDictionary 等类确认协议并实现相关方法后就可以通过 enumerateKeysAndObjectsWithOptions 来遍历了，也可以通过集合对象来调用 objectEnumerator 生成 NSEnumerator 类型的迭代器对象，然后通过迭代器对象的 nextObject 方法遍历集合，直到遍历结束 nextObject 返回 nil。苹果推荐使用 NSFastEnumeration，因为其速度更快，效率高。

```objc
NSEnumerator *enumerator = [dict objectEnumerator];
       
id obj = nil;
while (obj = [enumerator nextObject]) {
    ...
}
```

在 Swift 中使用更方便

```swift
for (offset, item) in items.enumerated() {
    ...  
}
```

### 中介者模式（Mediator）
中介者模式可以减少对象之间混乱无序的依赖关系，它会限制对象之间的直接交互，迫使它们通过一个中介者对象进行合作。在组件化开发时中介者模式可以实现项目中多组件之间的解耦合，避免它们之间互相依赖。中介者模式和代理模式的主要区别在于代理模式是一对一，中介者模式则是一对多。

```swift
Router.open("CardDetailViewController", bundle: Bundle.card, params: ["cardId": cardId])
```

MVC 中的 Controller 就是一个中介者，它的作用就是把 Model 和 View 隔离开并使它们之间可以协同工作。

### 备忘录模式（Memento）
游戏存档、数据库回滚以及编辑器中的撤消操作都是通过备忘录模式实现的，它主要是将不同状态的相关对象分别存起来，然后在需要时再恢复使用，在使用时要注意存储对象过多时的资源消耗问题，所以通常会将太久前的对象转为磁盘存储，近期对象用内存存储，以提高读取效率。

在 iOS 中是通过归档来实现的备忘录模式，需要存储到磁盘的对象要确认 NSCoding 并实现相关方法，然后就可以使用 NSKeyedArchiver 和 NSKeyedUnarchiver 来存储和读取归档后的对象，UserDefaults 不算备忘录模式，因为它存储不了对象。

```swift
class User: NSObject, NSCoding {
    var userId: String?
    var nickName: String?
    
    required init(coder decoder: NSCoder) {
        super.init()
        
        userId = decoder.decodeObject(forKey: "userId") as? String
        nickName = decoder.decodeObject(forKey: "nickName") as? String
    }

    func encode(with coder: NSCoder) {
        coder.encode(userId, forKey: "userId")
        coder.encode(nickName, forKey: "nickName")
    }
}
```

### 观察者模式（Observer）
观察者模式实现了一种订阅机制，可在对象事件发生时通知多个“观察”该对象的其他对象，它实现了观察者和订阅者的解耦，需要注意的是订阅者的通知顺序通常是随机的。

iOS 通过 Notification 和 Key-Value Observing 实现了观察者模式。

```swift
webView.observe(\.estimatedProgress) { [weak self] (webView, change) in
    ...
}

NotificationCenter.default.rx.notification(Notification.Name.User.didLogin).subscribe(onNext: { notification in
    ...
}).disposed(by: disposeBag)
```

### 访问者模式（Visitor）
在一个对象或者集合包含了很多其他的对象时，当要对这些对象增加一些新的方法，而且还是在业务上或功能上相关性很低的方法时，如果用直接修改代码的方式添加会污染对象所属类，这样不符合“开闭原则”和“单一职责原则”，这时可以考虑使用访问者模式处理，它可以在不修改对象类代码的情况下扩展对象功能，方式就是增加访问者类，并定义访问各个对象的方法。

访问者可以有多个，不同访问者访问对象的处理方式可以不同，例如饼图、柱图在处理不同业务数据时，可以有不同的表现样式，现实生活中对于相同食材，不同类型大厨做出来的味道和样子也可以不同，这些都可以理解成是访问者模式的应用。

```swift
public protocol Course {
    func scoresOfYear() -> [Float]
}

public class Math: Course {
    public func scoresOfYear() -> [Float] {
        return [70, 80]
    }
}

public class English: Course {
    public func scoresOfYear() -> [Float] {
        return [90, 95]
    }
}

public protocol Chart {
    func draw(_ course: Math?)
    func draw(_ course: English?)
}

public class PieChart: Chart {
    public func draw(_ course: Math?) {
        let score = course?.scoresOfYear()
        // 用饼图展示数学成绩
    }
    
    public func draw(_ course: English?) {
        let score = course?.scoresOfYear()
        // 用饼图展示英语成绩
    }
}

public class BarChart: Chart {
    public func draw(_ course: Math?) {
        // 用柱图展示数学成绩
    }
    
    public func draw(_ course: English?) {
        // 用柱图展示英语成绩
    }
}
```

访问者模式适用于数据结构相对稳定的系统，它把数据结构和作用于数据结构上的操作之间的耦合解脱开，如果频繁变化，那么访问者类也需要频繁修改，这样就意义不大了。

### 策略模式（Strategy）
完成一项任务，往往可以有多种方式，每一种方式称为一个策略，我们可以根据环境或者条件的不同选择不同的策略来完成指定任务。策略模式让算法独立于使用它的用户，并且可以避免把复杂的、与算法相关的数据结构暴露给用户，用户可以在不修改原有系统的基础上选择算法或行为，也可以灵活地增加新的算法或行为。
 
iOS 开发中 Array 类提供的 sorted 方法就是策略模式的应用，数组对象只需要指定排序方式，然后排序方法内部便会使用不同的排序实现类，排序方法将算法的实现和使用的代码隔离开，我们甚至可以在运行时动态指定要用哪种排序方式。 

```swift
print([3, 1, 5, 2, 7].sorted(by: <))

print([3, 1, 5, 2, 7].sorted(by: >))
```

策略模式另一种应用场景是解决多 if-else 问题，下面代码是没使用策略模式的实现方式。

```swift
public func textFieldDidEndEditing(_ textField: UITextField) {
    if textField == phoneNumberTextField {
        if textField.text.isPhoneNumber {
             ...
        } else {
             ...
        }
    } else if textField == captchaTextField {
        if textField.text.isCaptcha {
            ...
        } else {
            ...
        }
    }
    ...
}
```

使用策略模式后大概是下面这样

```swift
public protocol InputValidate {
    func check(_ text: String?) -> Bool
}

class PhoneNumberValidate: InputValidate {
    func check(_ text: String?) -> Bool {
        return text.isPhoneNumber
    }
}

class SMSCaptchaValidate: InputValidate {
    func check(_ text: String?) -> Bool {
        return text.isSMSCaptcha
    }
}

extension UITextField {
    private struct AssociatedKeys {
        static var validateObjectKey = "UITextField.validateObjectKey"
    }

    public var validateObject: InputValidate? {
        get {
            return objc_getAssociatedObject(self, &AssociatedKeys.validateObjectKey) as? InputValidate
        }
        set {
            objc_setAssociatedObject(self, &AssociatedKeys.validateObjectKey, newValue, .OBJC_ASSOCIATION_RETAIN)
        }
    }
}

class ViewController: UIViewController, UITextFieldDelegate {
    @IBOutlet weak var phoneNumberTextField: UITextField!
    @IBOutlet weak var captchaTextField: UITextField!
 
    override func viewDidLoad() {
        super.viewDidLoad()
        
        phoneNumberTextField.validateObject = PhoneNumberValidate()
        captchaTextField.validateObject = SMSCaptchaValidate()
    }
    
    func textFieldDidEndEditing(_ textField: UITextField) {
        if textField.validateObject?.check(textField.text) ?? true {
            ...
        } else {
            ...
        }
    }
}
```

策略模式的缺点是它会产生很多策略类，我们必须知道所有的策略类，并自行决定使用哪一个策略类。

### 状态模式（State）
状态模式允许对象在其内部状态改变时同时改变对象的行为，它建议为对象的所有可能状态新建一个类，然后将所有状态的对应行为抽取到这些类中，当对象的行为取决于它的状态，或者代码中包含大量与对象状态有关的条件语句时可考虑使用状态模式。

下面代码的应用场景比较符合状态模式，只是不同状态不一定会对应不同的类。

```swift
let button = UIButton(type: .custom)
        
button.setTitle("默认状态", for: .normal)
button.setTitle("选中状态", for: .selected)
button.setTitle("禁用状态", for: .disabled)
        
button.setTitleColor(.black, for: .normal)
button.setTitleColor(.darkGray, for: .selected)
button.setTitleColor(.lightGray, for: .disabled)
        
button.setBackgroundImage(R.image.buttonNormal(), for: .normal)
button.setBackgroundImage(R.image.buttonSelected(), for: .selected)
button.setBackgroundImage(R.image.buttonDisabled(), for: .disabled)
```

状态模式与策略模式的区别主要在于策略模式是通过外界注入再以不同算法实现，而状态模式是根据内部状态的改变来切换不同算法，并且状态之间知道彼此的存在，且能触发从一个状态到另一个状态的转换，策略模式则几乎完全不知道其他策略的存在。

状态模式和策略模式的相同点是它们在使用时必然会增加系统类和对象的个数，而且类的结构与实现都较为复杂，如果使用不当将导致程序结构和代码的混乱。

### 模板方法模式（Template Method）
我们将实现某个功能的整个算法拆分为一系列独立的步骤，当你只希望子类扩展某个特定算法步骤，而不是整个算法时可使用模板方法模式。

```swift
class ViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()

    }
    
    override func viewWillLayoutSubviews() {
        super.viewWillLayoutSubviews()

    }
    
    override var shouldAutorotate: Bool {
        return false
    }
    
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
        return .portrait
    }
}
```

# 总结
正确合理的使用设计模式可以使代码变得更加简洁，并易于维护和扩展，不合理的使用会增加代码复杂度并导致代码混乱，所以我们在设计开发时不要过度设计，不要为了"套模式"而使用设计模式，而是要具体问题具体分析，根据实际情况进行权衡。

-------

1994 年除了诞生了设计模式这本书以外还有很多重要事件：中国互联网与美国互联网连接、曼德拉当选南非首任黑人总统，还产生了很多精彩电影，《肖申克的救赎》、《阿甘正传》、《低俗小说》、《狮子王》、《夜访吸血鬼》、《这个杀手不太冷》、《阳光灿烂的日子》、《精武英雄》、《重庆森林》、《东邪西毒》、《活着》