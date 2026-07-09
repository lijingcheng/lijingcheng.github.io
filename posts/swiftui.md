---
title: "SwiftUI 工程化实践：从 MVI 架构到性能优化"
date: 2026-07-08 15:09:29 +0800
---

> 基于 iOS 18+ / Swift 6 / SwiftUI 的项目实战记录。本文不谈入门 Hello World，只聊工程中踩过的坑和沉淀下来的模式。

---

## 一、为什么选这套技术栈

| 维度 | 选择 | 取舍 |
|------|------|------|
| **最低系统** | iOS 18+ | 放弃存量用户，换来全部新 API 无历史包袱 |
| **语言** | Swift 6（严格并发检查） | 编译期消除数据竞争，代价是学习曲线陡峭 |
| **UI 框架** | SwiftUI 6.0 | 不混编 UIKit，纯声明式 |
| **架构** | MVI | 单向数据流，状态枚举互斥，可测试性极强 |
| **状态管理** | `@Observable` 宏 | 属性级精确追踪，替代 ObservableObject |
| **持久化** | SwiftData | 替代 Core Data |
| **并发** | async/await + Actor + @MainActor | 结构化并发，不写一行 DispatchQueue |
| **图片加载** | Kingfisher | 通过 AppImage 封装，按控件实际尺寸请求对应分辨率 |

> 如果你读到这里想问"为什么不用 MVVM"，跳转 [第三章](#三架构为什么选-mvi) 有详细对比。

---

## 二、SwiftUI 的底层：这些概念搞懂了才不会写出 bug

### 2.1 声明式 vs 命令式

这不是语法差异，是编程范式的转变：

```
UIKit 命令式:                      SwiftUI 声明式:
"找那个 Label，改它的 text"        "当 count 变化时，Label 自动显示最新值"

// UIKit
label.text = "\(count)"            Text("\(count)")  // 自动追踪，自动刷新
view.isHidden = !isLoggedIn        .opacity(isLoggedIn ? 1 : 0)
self.navigationController?         NavigationStack(path: $router.path)
    .pushViewController(vc)
```

核心认知转变：在 UIKit 中视图是持久存在的对象，靠代码修改其属性。在 SwiftUI 中视图是轻量级 struct，**只是状态的快照**——不要去"找"某个视图修改它，而应该修改状态，让框架对比并刷新。

### 2.2 some View 与 TupleView

`var body: some View` 中的 `some` 是不透明返回类型。如果不使用它，你需要写出：

```swift
// ❌ 实际类型极复杂
var body: VStack<TupleView<(Text, Button<Text>)>> {
    VStack {
        Text("Hello")
        Button("Click") { }
    }
}
```

`View` 协议带有关联类型，编译器在编译期必须确定内存分配大小。`some` 保证返回类型是固定的（即使看不见具体类型），而直接用 `View` 协议类型（existential type）编译器无法确定大小，直接报错。

**TupleView**：当你在 `VStack` 里放入多个子视图时，`@ViewBuilder` 自动将它们打包成 `TupleView`。这就是为什么 `body` 只能返回"一个"视图——多个子视图被自动打包成了一个整体。

### 2.3 视图身份（Identity）——为什么 if 会杀死你的动画

SwiftUI 根据视图在类型树中的*位置*确定身份：

```swift
if isError {
    Text("Error!")    // 类型树位置：VStack.0.if.true.Text
} else {
    Text("Welcome")   // 类型树位置：VStack.0.if.false.Text
}
// ⚠️ isError 切换时，SwiftUI 认为这是两个不同身份的视图
// → 销毁旧的，创建新的（@State 丢失、动画断裂！）
```

**正确做法**：用三元运算符保持身份不变

```swift
Text(isError ? "Error!" : "Welcome")
    .foregroundStyle(isError ? .red : .blue)
// ✅ 同一个 Text，身份稳定，只有样式变化
```

**显式身份**用于动态数据：

```swift
ForEach(items, id: \.id) { item in ... }  // ✅ 稳定的数据 ID
// ❌ ForEach(items, id: \.self)           // Hashable 可能不稳定
// ❌ .id(UUID())                          // 每次渲染都是新 ID → 永远无法复用
```

关键认知：`@State` 的实际值存在 AttributeGraph 中，不随 View struct 重建而丢失。但**当视图身份改变时（如被 `if` 销毁重建），State 也重置**。

### 2.4 视图生命周期

```
出现（Appearing）
    ├── View struct 初始化（临时配置描述，不等同于"视图被创建"）
    ├── 连接到 AttributeGraph（订阅状态依赖）
    ├── 首次渲染 body
    ├── onAppear 回调
    └── 渲染到屏幕

更新（Updating）
    ├── 依赖的 Attribute 失效 → body 被重新调用
    ├── SwiftUI diff 新旧 body 的输出
    ├── 仅更新变化的渲染树节点
    └── 旧 View struct 被丢弃（临时值用完即丢）

消失（Disappearing）
    ├── onDisappear 回调
    ├── .task{} 自动取消（结构化并发生命周期绑定）
    └── 从渲染树中移除
```

View struct 只是一个"配置描述"，极其轻量且临时。init 频繁调用 ≠ 视图被重建。真正的视图状态（@State）存储在 AttributeGraph 中。

### 2.5 差异算法（Diffing）

SwiftUI 利用 Swift 类型系统，大部分 diff 无需运行时计算：

```swift
// 从：VStack { Text("A"); Image("icon") }
// 到：VStack { Text("B"); Image("icon") }
// → 类型不变，仅数据变化 → 更新 Text 的数据，Image 不更新

// 但如果类型变了：
// 从：VStack { Text("A"); Image("icon") }
// 到：VStack { Text("A"); Button("x") }
// → Image → Button，类型变化 → 销毁 Image，创建 Button
```

**ForEach 的动态 Diffing** 采用 Myers Algorithm 变体：

```swift
// 数据变化：[A, B, C] → [A, C, D]
// 1. B 被删除（通过 ID 匹配）
// 2. C 保持不变（复用，保留动画和 State）
// 3. D 是新增（创建新视图）
```

⚠️ **AnyView 的危害**：

```swift
func badge(for item: Item) -> AnyView { ... }
// 类型信息被擦除 → SwiftUI 无法做类型推断 → 每次变化都完全销毁重建

// ✅ 用 @ViewBuilder 保留类型
@ViewBuilder func badge(for item: Item) -> some View { ... }
// 类型：_ConditionalContent<Image, Text> → 精确 diff
```

### 2.6 状态管理速查

| 属性包装器 | 用途 | 数据持有 | 使用场景 |
|-----------|------|---------|---------|
| `@State` | 视图私有本地状态 | 本视图 | 局部 UI 状态（开关、输入框文本） |
| `@Binding` | 读写父视图状态 | 父视图 | 父子组件值传递 |
| `@Bindable` | 从 @Observable 对象获取 Binding | 对象自身 | @Observable 类属性的双向绑定 |
| `@Environment` | 读取环境值 | 上游注入 | 跨层级依赖（主题、路由、用户） |
| `@AppStorage` | UserDefaults 绑定 | UserDefaults | 偏好设置（含 UI 自动刷新） |

**@State 的实际存储位置：**

`@State` 的数据**不存储在 View 结构体中**，而是在 SwiftUI 私有的 **AttributeGraph** 节点中。这就是为什么 View struct 被反复创建/销毁，但 `@State` 值不丢失——真正的数据存在 AttributeGraph 中，View struct 只是持有指向它的"钥匙"。

**@Binding 的本质**：不是数据副本，而是双向数据管道。它大致等价于：

```swift
struct Binding<Value> {
    var get: () -> Value       // 从哪里读
    var set: (Value) -> Void   // 写到哪里去
}
```

ChildView 写入 `text` → 实际修改的是 ParentView 的 `@State` → ParentView 的 body 重新执行。

**按场景选择工具：**

| 场景 | ✅ 正确 | ❌ 禁止 |
|------|--------|---------|
| 视图私有 UI 状态 | `@State` + 值类型 | `@StateObject` |
| 跨视图共享对象 | `@Observable` class | `ObservableObject` + `@Published` |
| 子视图读写父状态 | `@Binding` | 直接修改父对象属性 |
| 跨层注入服务 | `@Environment` | 全局单例 / 静态变量 |

### 2.7 @Observable 精确订阅——为什么它比 ObservableObject 好得多

`@Observable` 宏实现属性级别依赖追踪，自动追踪到每个属性的读写：

```swift
@Observable
class UserModel {
    var name = ""
    var age = 0
}
// age 变化 → 只刷新 body 中实际读取了 age 的视图
// 没有读取 age 的视图完全不受影响！
```

对比如今被标记废弃的 `ObservableObject`：任意 `@Published` 属性变化都会触发所有订阅视图的 `objectWillChange` → 所有视图重新计算 body → 大量无意义的工作。

**底层原理（ObservationRegistrar）：**

```
body 执行时：
  → 创建"观察上下文"
  → 每次属性 get：registrar.access(self, keyPath: \.name)
  → 将 name 注册到当前上下文的依赖列表

属性 set 时：
  → registrar.withMutation(keyPath: \.name) { ... }
  → 查找所有订阅了 name 的观察上下文
  → 仅通知这些上下文对应的视图失效
```

**@ObservationIgnored** 排除不需要观察的属性：

```swift
@Observable
class MediaPlayer {
    var isPlaying = false                  // ✅ 触发 UI 刷新

    @ObservationIgnored
    var downloadCache = NSCache<NSString, NSData>()  // 缓存，不需要 UI 刷新

    @ObservationIgnored
    var scrollOffset: CGFloat = 0          // 高频变化，手动控制刷新时机
}
```

---

## 三、架构：为什么选 MVI

### 3.1 MVI 单向数据流

核心理念：**View 不包含任何业务逻辑，只负责 UI 渲染和用户意图上报**。

```
┌──────────┐    Intent     ┌───────────────┐    update    ┌───────────┐
│   View   │ ────────────→ │  Container    │ ──────────→ │   State   │
│ (渲染层)  │ ←──────────── │  (逻辑层)     │ ←────────── │  (数据层)  │
└──────────┘    observe     └───────────────┘    read     └───────────┘
```

**完整示例：**

```swift
// --- State（数据层）---
struct CounterState {
    var count: Int = 0
    var isLoading: Bool = false
}

// --- Intent（用户意图枚举）---
enum CounterIntent {
    case increment
    case decrement
    case fetchData
}

// --- Container（逻辑层）---
@Observable @MainActor
class CounterContainer {
    private(set) var state = CounterState()   // 外部只读

    func send(_ intent: CounterIntent) {
        switch intent {
        case .increment:
            state.count += 1
        case .decrement:
            state.count -= 1
        case .fetchData:
            state.isLoading = true
            Task {
                try? await Task.sleep(for: .seconds(1))
                state.count += 10
                state.isLoading = false
            }
        }
    }
}

// --- View（渲染层，只发 Intent）---
struct CounterView: View {
    @State private var container = CounterContainer()

    var body: some View {
        VStack(spacing: 20) {
            if container.state.isLoading {
                ProgressView()
            } else {
                Text("\(container.state.count)")
                    .font(.largeTitle.weight(.bold))
            }

            HStack {
                Button("减") { container.send(.decrement) }   // ← 只发 Intent
                Button("加") { container.send(.increment) }
                Button("异步+10") { container.send(.fetchData) }
            }
            .buttonStyle(.bordered)
        }
    }
}
```

**关键约束：**
- `state` 的 setter 设为 `private(set)`：外部只能读，所有修改必须经过 `send(_:)`
- `Button {}` 闭包里只做一件事：`container.send(.intent)`，不直接修改任何状态值
- Container 不 `import SwiftUI`，逻辑层与 UI 彻底解耦

### 3.2 MVI vs MVVM 对比

| 问题 | MVVM | MVI |
|------|------|-----|
| 状态一致性 | 多个独立变量可能矛盾（如 isLoading=true 同时 isError=true） | State 枚举互斥，同一时间只有一种状态 |
| 调试 | 难以追溯谁改了哪个变量 | 所有操作经 Intent 枚举，一目了然 |
| 测试 | ViewModel 方法散落 | 给定 Intent 序列 = 100% 还原现场 |
| KMP 兼容 | 双端逻辑差异大 | send(Intent) 接口天然契合 StateFlow |
| View 维护 | View 直接调用 ViewModel 的各种方法，新人需要翻遍才能理解 | 看一眼 Intent 枚举就知道页面全部能力 |

### 3.3 路由导航——解决 NavigationPath 的黑盒限制

`NavigationPath` 本质是一个类型擦除的**栈数据结构**。它与 `NavigationStack(path: $path)` 绑定后，SwiftUI 通过 `navigationDestination(for:)` 将栈中元素映射到对应视图：

```
根视图 → path 为空 []
  ↓ path.append(MallRoute.detail(id: "1"))
第二层 → path = [MallRoute.detail(id: "1")]
  ↓ path.append(MallRoute.payment)
第三层 → path = [MallRoute.detail(id: "1"), MallRoute.payment]
  ↓ path.removeLast()（pop 一层）
第二层 → path = [MallRoute.detail(id: "1")]
  ↓ path.removeLast(path.count)（popToRoot）
根视图 → path = []
```

问题是 `NavigationPath` 是类型擦除的——你不知道栈里有什么，无法查询"当前栈里有没有某个页面的实例"，也无法精确回退到指定页面。于是有了**影子路径**：维护一个 `[any Routable]` 数组与 `NavigationPath` 同步增减，既可查询也可精确 pop。

**路由体系三层架构：**

| 层级 | 职责 |
|------|------|
| **协议层** | `Routable` 协议（需 Hashable + 定义 `needsLogin`） |
| **引擎层** | 泛型 `Router<Tab>` 类——管理多 Tab NavigationPath、push/pop/switchTab、登录拦截、DeepLink 解析 |
| **模块路由** | 每个业务模块定义自己的 `enum XxxRoute: Routable`，包含路由到视图的映射和 `needsLogin` 标记 |

模块路由定义示例：

```swift
public enum HomeRoute: Routable {
    case movieDetail(id: String)
    case premiumContent(id: String)

    public var needsLogin: Bool {
        switch self {
        case .movieDetail: return true
        default: return false
        }
    }

    @ViewBuilder
    var destination: some View {
        switch self {
        case .movieDetail(let id): MovieDetailView(id: id)
        case .premiumContent(let id): ProductDetailView(id: id)
        }
    }
}
```

**Router 的独特能力集合：**

- **登录拦截 + 恢复**：未登录时 `triggerLogin()` 不丢路由，而是记录目标路由到 pending，弹出登录页。登录完成后自动消费 pending 并跳转。用户全程无感知。
- **防重复点击**：同一路由 0.3 秒内不重复 push，防止用户狂点导致导航栈出现多个相同页面。
- **跨 Tab 跳转**：`switchTabAndPush(tab:route:)` ——先切 Tab、再推入页面，一次调用完成。
- **DeepLink 处理器注册**：`handlers` 字典按 host 匹配，链接到来时自动解析并跳转。新增一个 DeepLink 类型只需新增一个 Handler 并注册即可。

### 3.4 主题系统——颜色语义化，深浅色自动适配

不硬编码颜色是基本功，但做到"添加一个页面时不用想颜色"需要一套语义化命名：

```swift
extension ShapeStyle where Self == Color {
    static var brand: Color { ... }             // 品牌主色
    static var brandSecondary: Color { ... }    // 品牌辅色
    static var appBg: Color { ... }             // 页面背景（自适应深浅色）
    static var cardBg: Color { ... }            // 卡片背景
    static var divider: Color { ... }           // 分割线
    static var textPrimary: Color { ... }       // 主文字色
    static var textSecondary: Color { ... }     // 次文字色
}
```

使用效果：

```swift
Text("标题").foregroundStyle(.textPrimary)
VStack { ... }.background(.cardBg)
SomeView().cardStyle()  // 一键应用卡片样式
```

通过 `@Observable` 单例 `Appearance.shared` 全局驱动暗黑模式切换（浅色/深色/跟随系统），所有引用语义色的视图自动响应变化——不需要在每个页面监听 `colorScheme`。

### 3.5 全局 UI 管理——Toast/Loading/Alert 统一驱动

业务代码不关心 Toast/Loading 怎么实现，只需要发 Intent：

```swift
send(.toast("操作成功"))
send(.toast("网络错误", duration: 3.0))
send(.loading(true, text: "加载中..."))
send(.loading(false))
send(.showAlert(title: "确认退出", message: "退出后需要重新登录", confirmTitle: "退出", cancelTitle: "取消") {
    // 确认后执行
})
```

实现要点：
- `@Observable @MainActor` 单例管理全局 UI 状态，`.overlay` 挂载到 ContentView 顶层
- Toast 自动消失（默认 2 秒），通过快照对比防止误销毁——短 Toast 关闭后、新的长 Toast 不应被旧定时器干掉
- Loading 自带 **8 秒超时保护**，避免接口卡死导致 UI 永久冻结
- Alert 基于系统原生 `.alert`，自动处理 `isPresented` 绑定

**一个容易被忽略的坑——渲染层级：**

```
Window (手机屏幕)
  ├── 🌟 sheet / fullScreenCover        ← Window 级弹出，盖住一切
  │
  └── 📱 ContentView
        ├── TabView
        │    ├── Page1 / Page2 / Page3
        └── .overlay(Toast / Loading)    ← 覆盖所有 Tab 子页面
                                           ← 但会被 sheet 盖死！
```

`.sheet` 和 `.fullScreenCover` 在 Window 级弹出，会盖死 ContentView 上的 `.overlay(Toast)`。如果需要在 sheet 内也显示 Toast，每个页面需独立挂载 `.overlay`。项目中的 LoginView 用 `fullScreenCover`（独立流程），其余弹窗统一用 `.overlay`（同一视图层级），避免"Toast 消失了但用户没看到"的诡异问题。

### 3.6 页面状态管理——一行代码注入完整状态处理

每个页面都要处理 loading/empty/error/network 状态，代码大量重复。解决方式：`BaseContainer` + `PageStateModifier`。

```swift
// 状态枚举
enum PageState: Equatable {
    case idle, loading, refreshing, success, empty, networkUnavailable, error(String)
}

// 业务 View 中使用
struct MallHomeView: View {
    @State private var container = MallContainer()

    var body: some View {
        ScrollView {
            // 正常页面内容
        }
        .pageState(container)  // 一行代码：自动处理所有页面状态
    }
}
```

`PageStateModifier` 根据 container 的 `pageState` 自动展示：
- `loading` → 保持原内容但显示全局 Loading
- `empty` / `networkUnavailable` / `error` → 自动替换为 `ContentUnavailableView`，附带"重试"按钮

### 3.7 Mock 开发机制——Debug 自动走 Mock，Release 零污染

核心思路：不依赖真实接口即可完成 UI 开发、调试所有边界状态。

`BaseContainer.execute()` 是所有业务页面加载的入口，它的内部编排：

```
execute(force: Bool, isSilent: Bool)
  ├── 检查 hasLoaded 防重复（force=true 可强制重刷）
  ├── 检查网络状态（无网络 → 直接 pageState = .networkUnavailable）
  ├── 取消上一次 Task（防时序错乱）
  ├── 设置 pageState = .loading 或 .refreshing
  └── #if DEBUG
      ├── try await fetchMock()   // Debug 走 Mock，读取本地 JSON
      └── #else
          └── try await fetch()   // Release 走真实接口
```

```swift
// 业务 Container 只需重写这两个方法，其余全部由基类接管
class MallContainer: BaseContainer {
    override func fetch() async throws {
        let data = try await APIService.fetchMallData()
        state.items = data
        pageState = .success
    }

    override func fetchMock() async throws {
        let data: MallResponse = try JSONLoader.load("mall_mock.json")
        state.items = data
        pageState = .success
    }
}
```

其中一个小技巧：Build Phase Script 自动删除 Mock JSON 文件：

```bash
# Copy Bundle Resources 之后执行
if [ "${CONFIGURATION}" != "Debug" ]; then
    find "${BUILT_PRODUCTS_DIR}/${CONTENTS_FOLDER_PATH}" -name "*_mock.json" -delete
fi
```

JSON 文件正常加入 Target 无需手动操作，只在 Debug 包中存在。主流程代码零污染——`#if DEBUG` 是编译期分支，Release 二进制中根本不存在 Mock 相关代码路径。

**Preview 直接切换边界状态：**

```swift
#Preview("正常状态") {
    MallHomeView()
}

#Preview("网络异常") {
    let c = MallContainer()
    c.pageState = .networkUnavailable
    return MallHomeView().pageState(c)
}
```

在 Preview 里手动设置 `pageState` 即可瞬间看到任何边界状态的 UI，不需要 Mock JSON、不需要跑 App、不需要改代码。
}
```

---

## 四、冷启动流程管理——容易被忽略却最容易翻车的三个设计

冷启动是 App 最复杂的阶段。启动流程、弹窗队列、外部跳转三件事会同时发生，任何一件处理不当都会出问题。下面逐一展开。

### 4.1 启动状态机：把 if-else 地狱变成枚举驱动的显式状态

一个常见错误是：用一堆 `hasAgreedToPrivacy`、`isFirstStart`、`hasAd` 等 Bool 变量驱动 RootView，然后用层层嵌套的 `if` 控制展示什么。当变量变多时，组合爆炸——你不知道哪些状态组合是合法的，调试时经常出现"两个弹窗同时出现"或"跳过了一个状态"。

**正确做法：用一个状态枚举，一次只处于一个状态。**

`FlowManager` 管理 App 从冷启动到首页就绪的完整状态切换：

```
App Launch
     │
     ▼  [iOS Launch Screen — 系统级闪屏，FlowManager 不管理]
     │
┌─────────────┐  hasAgreedToPrivacy == false?
│  privacy     │ ──────────────────────────→ 展示隐私协议页
└──────┬──────┘
       │ 用户同意（调用 flowManager.agreePrivacy()）
       ▼
┌─────────────┐  isFirstStart == true?
│  guide       │ ────────────────────────────→ 展示引导页
└──────┬──────┘
       │ 引导完成（或非首次启动直接跳过该状态）
       ▼
┌─────────────┐  hasAd == true?
│  ad          │ ────────────────────────────→ 展示开屏广告
└──────┬──────┘
       │ 广告结束（或无广告直接跳过该状态）
       ▼
┌─────────────┐
│  main        │ 主界面就绪 — TabView + 弹窗队列开始工作
└─────────────┘
```

状态切换逻辑集中在 `RootView` 的一个 `switch flow` 中，所有分支一处可见。每个状态有自己的进入条件和完成回调，隐私、引导、广告都是独立的 View，不互相嵌套。

**关键设计：每一步都是一个"闸门"，状态完成后必须显式调用 next 才能前进。** 这让流程极度可预测——无论是正常启动、首次安装、还是用户中途拒绝了隐私协议，都能从状态枚举一眼看清当前所处阶段。

### 4.2 初始化任务编排：同步先行、异步并发

`AppConfigurator.setup()` 在 `RtimeApp.init()` 中调用，按依赖关系分两阶段编排启动任务。核心原则：能并行的一定不串行，能延后的一定不阻塞首帧。

**第一阶段：同步初始化（主线程，必须在首帧之前完成）**

```
路由注册（home/mine/mall 三个 LinkHandler）
WebView messageHandlers 配置
用户态恢复（User.shared.restore()）
版本升级缓存清理（跨版本清 URL 缓存，避免旧缓存污染）
网络恢复回调注册
UIAppearance 设置
```

这些都是后续流程的"硬依赖"——路由没注册则 DeepLink 无法解析，用户态没恢复则登录状态判断错误。但每个任务都很轻量（毫秒级），同步执行不会造成可感知的延迟。

**第二阶段：异步初始化（TaskGroup 并发，不阻塞 UI）**

```
三方 SDK 初始化
版本检查接口（检查是否有强制升级）
```

`TaskGroup` 并发执行，主线程立即返回，首帧不等待这些任务。这里有个权衡：SDK 初始化和版本检查都不影响首帧展示，但版本检查的结果可能触发 `PopupManager` 入队一个 force upgrade 弹窗——这个弹窗在 4.3 节会详述。

### 4.3 弹窗优先级队列——这是全文最容易被低估的设计

先说问题场景：冷启动完成，首页渲染完毕，此时**同时**可能有这三个弹窗需要展示：

- 强制升级弹窗（用户不升级不能继续用）
- 运营广告弹窗（运营配置的推广图）
- 隐私协议弹窗（如果之前没同意过）

如果没有调度机制，这三个弹窗的执行顺序完全取决于三个异步任务谁先完成——结果随机、测试不可复现、线上表现不可控。更糟糕的是：如果弹窗在首页还没渲染完就触发，用户会看到"白屏上弹出一个对话框"。

**PopupManager 的设计：**

```
优先级：urgent(.upgrade) > high(.popAD) > normal

入队规则：
- 同 ID 弹窗自动去重（新入队替换旧的）
  → 比如版本检查回调多次触发 upgrade，只有最新一条生效
- 高优先级可打断当前低优先级弹窗（被打断的退回队列头部）
  → 广告弹到一半，版本检查发现强制升级 → 广告退回队列，升级弹窗顶上
  → 升级弹窗关闭后，广告从队列头部取出继续展示
- 只有 homeVisible == true 时才出队展示
  → 首页没渲染完？所有弹窗乖乖排队等着
```

**弹窗类型的差异化处理：**

| 类型 | 场景 | 用户可关闭？ | 被打断行为 |
|------|------|------------|-----------|
| `upgrade(force: true)` | 强制升级 | 否（不允许点击背景关闭） | 不被任何弹窗打断 |
| `upgrade(force: false)` | 建议升级 | 是 | 可被 force upgrade 打断 |
| `popAD(imageUrl:)` | 运营广告图 | 是 | 可被升级弹窗打断，退回队列 |

**为什么这个设计值得单独讲：**

大多数 App 的弹窗管理就是"需要时 present 一个 sheet"，这在简单场景下够用。但一旦弹窗之间有优先级关系、有时序要求（首页加载完才能弹），散落的 `@State var showXxx = true` 就彻底失控了。PopupManager 把"弹窗"抽象为独立的数据类型，入队/出队/打断/去重都是 Queue 操作，逻辑集中在一个文件里，行为和测试预期 100% 一致。

### 4.4 Deep Link 时序——外部触发与内部状态的协调

最后一个时序问题：用户点击 Push 通知或 Universal Link → iOS 唤起 App → `onOpenURL` 回调触发 → 但此时流程可能还没走到 `main` 状态。

```swift
func handleDeepLink(_ url: URL) {
    guard homeVisible else {
        pendingURL = url     // 首页未就绪 → 暂存，不丢失
        return
    }
    navigate(to: url)        // 首页就绪 → 直接解析跳转
}

func homeDidAppear() {
    homeVisible = true
    handlePendingURLIfNeeded()  // 消费暂存的 DeepLink
    tryShowNext()              // DeepLink 处理完 → 开始弹窗队列
}
```

`homeVisible` 是核心同步点。它只在整个流程走完、状态机进入 `main`、且首页视图 `onAppear` 回调后才设为 `true`。在这个点之前到达的一切外部跳转都暂存到 `pendingURL`，等 `homeDidAppear` 消费。处理顺序是：先消费暂存的 DeepLink → 再开弹窗队列。因为 DeepLink 是用户主动行为（点击通知），优先级高于运营弹窗。

---

## 五、SwiftUI 日常开发实践

### 5.1 sheet / overlay / fullScreenCover 选哪个

这三种方式都能在当前视图上展示新内容，但层级和机制完全不同：

| 特性 | `.overlay` | `.sheet` | `.fullScreenCover` |
|------|-----------|----------|-------------------|
| **层级** | 同一视图树内叠放 | 新 Window 级弹出 | 新 Window 级弹出 |
| **能否被非 Popover 内容覆盖** | 不能（在同层最顶部） | 能——它会在 overlay 之上升起一个新图层 | 同 sheet |
| **手势关闭** | 不支持 | 支持（下滑关闭） | 需要手动控制 |
| **适用场景** | Toast、Loading、水印、浮动按钮 | 表单、选择器、临时任务 | 登录页、引导页、支付页（独立流程） |

**选择建议：**
- 浮层交互、临时任务 → `.sheet`
- 独立完整流程 → `.fullScreenCover`
- 水印、悬浮按钮、全局提示 → `.overlay`

### 5.2 .task{} vs onAppear——这是最容易用错的地方

| | `onAppear` | `.task {}` |
|---|---|---|
| **闭包类型** | 同步 `() -> Void` | 异步 `() async -> Void` |
| **支持 async/await** | 否（需手动包 `Task {}`） | 是 |
| **任务取消** | 无法自动取消 | 视图消失时自动发送取消信号 |
| **重执行** | 每次 appear 都执行 | `.task(id:)`：id 变化时取消旧任务+执行新任务 |

关键区别：

```swift
// ❌ onAppear 做异步：任务不会被自动取消
.onAppear {
    Task {
        let data = await fetchData()   // 视图已消失，这个下载仍然继续
        updateUI(data)                 // 可能崩溃
    }
}

// ✅ .task：视图消失自动取消
.task {
    let data = await fetchData()       // 视图消失后，任务被取消
    updateUI(data)                     // 安全：只在视图存活时执行
}
```

`.task(id:)` 更加强大：同时拥有 `onAppear` 和 `onChange` 的能力，适合根据选中项变化加载不同数据。

### 5.3 ForEach 视图复用与 id 稳定性

SwiftUI 通过 id 判断两个视图是否为"同一个"，从而决定复用还是重建：

```swift
// ✅ 使用稳定的数据主键
ForEach(items, id: \.id) { item in   // id 稳定 → 视图复用 → 动画流畅
    ItemRow(item: item)
}

// ❌ 危险：用 \.self（Hashable 不稳定）
ForEach(items, id: \.self)

// ❌ 致命：.id(UUID())
.id(UUID())  // 每次 body 执行都是新 UUID → 永远无法复用！
```

用数组 index 作为 id 也有坑：删除一个元素后，后续所有元素的 index 都变了，SwiftUI 会错误地"复用"不同数据的视图。

### 5.4 @ViewBuilder 与 ViewModifier

**用 `@ViewBuilder` 减少 body 内嵌套：**

```swift
// ❌ body 嵌套太深
var body: some View {
    VStack {
        if isLoading {
            ProgressView()
        } else if items.isEmpty {
            Text("暂无数据")
        } else {
            List(items) { item in Text(item.name) }
        }
    }
}

// ✅ 用 @ViewBuilder 抽离状态分支
var body: some View {
    VStack {
        contentOverlay
    }
}

@ViewBuilder
private var contentOverlay: some View {
    if isLoading {
        ProgressView("加载中...")
    } else if items.isEmpty {
        ContentUnavailableView("暂无记录", systemImage: "mountain.2")
    } else {
        listView
    }
}
```

**ViewModifier vs Extension：**

| 特性 | Extension | ViewModifier |
|------|-----------|-------------|
| 持有 @State | ❌ | ✅ 可以封装复杂交互 |
| 实现动画（Animatable） | ❌ | ✅ |
| 多次使用 content | ❌ | ✅ 如水印叠在 content 前面 |
| 类型安全 | 一般 | ✅ 明确定义为一个类型 |

### 5.5 LazyVStack / List / ScrollView 选择指南

| 组件 | 本质 | 适用场景 |
|------|------|---------|
| **List** | 内置差量更新与滑动删除 | 需要原生滑动删除、分组样式、编辑模式时 |
| **LazyVStack + ScrollView** | 仅渲染可视区域，更轻量 | 普通列表、卡片流、不需要系统 List 特性 |
| **VStack + ScrollView** | 一次性创建所有子视图 | **禁止**用于长列表（内存爆炸） |

### 5.6 实用 Tips 速查

**用 `opacity` 替代 `if` 控制显隐：**

```swift
// ❌ 条件分支 → 销毁重建视图 → 动画断裂 + 性能损耗
if isShowing { Text("提示") }

// ✅ 保持在视图树中 → 只改透明度 → 动画丝滑
Text("提示").opacity(isShowing ? 1 : 0)
```

**sheet/fullScreenCover 统一管理：**

用 `@State<Route?>` + 枚举替代散落的 Bool 标志，同一时刻只有一个弹出层：

```swift
enum SheetRoute: Identifiable {
    case editProfile(User)
    case imagePicker
    var id: String { ... }
}

@State private var sheet: SheetRoute?

.sheet(item: $sheet) { route in
    switch route {
    case .editProfile(let user): EditProfileView(user: user)
    case .imagePicker: ImagePickerView()
    }
}
```

**前景色与字体：**

```swift
// ✅ 推荐（支持 Dynamic Type）
.foregroundStyle(.blue)        // ❌ .foregroundColor(.blue)  已废弃
.font(.body)                    // ❌ .font(.system(size: 17)) 不支持动态字体
.font(.title.weight(.bold))     // ❌ .font(.system(size: 28, weight: .bold))
```

**页面回传数据：**
- 简单值 → `@Binding`
- 复杂数据 → 共享 `@Observable` 的 Container，pop 后上一页自动响应变化

### 5.7 自定义 EnvironmentKey 依赖注入

`@Environment` 的核心价值是**跨层级注入依赖**，让深层子视图无需逐层传参：

```swift
// 1. 定义 Key + 默认值
private struct APIClientKey: EnvironmentKey {
    static let defaultValue: any APIClientProtocol = LiveAPIClient()
}

extension EnvironmentValues {
    var apiClient: any APIClientProtocol {
        get { self[APIClientKey.self] }
        set { self[APIClientKey.self] = newValue }
    }
}

// 2. App 入口注入
ContentView()
    .environment(\.apiClient, LiveAPIClient())
// Preview Mock 注入：
    .environment(\.apiClient, MockAPIClient())

// 3. 任意层级子视图读取
@Environment(\.apiClient) var apiClient
.task { let data = try? await apiClient.fetch() }
```

适用场景：全局通用服务（网络、数据库、分析）。不适用：业务私有数据、变化频率高的状态（会触发大量无关视图刷新）。

---

## 六、性能与质量——这些事开发时就要想清楚

工程的性能问题从来不是上线后靠 Instruments 揪出来的，而是在写每一行代码时就预防掉的。下面几个维度是日常开发中反复踩坑后的沉淀。

### 6.1 性能红线：body 的每次调用都经不起浪费

**1. body 内不做复杂计算：**

```swift
// ❌ 每次 body 执行都创建 DateFormatter
var body: some View {
    let formatter = DateFormatter()  // 极其昂贵：每次创建都查磁盘加载 locale 数据
    Text(formatter.string(from: date))
}

// ✅ 预格式化，只渲染字符串
var body: some View {
    Text(dateString)  // Container 中已完成格式化
}
```

DateFormatter 的初始化会读取系统 locale 数据，在 body 高频调用时是性能杀手。同理，排序、复杂 filter、正则匹配都应该在 Container 中完成，body 只负责"把已经算好的文本显示出来"。

**2. 视图拆分粒度：** body 不超过 50 行。同时将状态"推低"到使用它的最深层视图——一个顶层 `@State` 的变化不应导致整个页面 500 个视图都重新 diff。对纯展示型子视图显式标注 `Equatable`，配合 `.equatable()` 跳过无关重渲染。

**3. 图片按需加载：** 通过 `GeometryReader` 获取控件实际 frame（pt），截断为整数像素后拼接到图片代理 URL，按需请求对应分辨率图片。避免在 80×80 的头像位加载 2000×2000 的原图。

具体做法：用 `ImageSizeKey` 将 `CGSize` 截断为 `(Int, Int)` 对，仅整数像素维度变化时才更新 URL。这能避免 sub-pixel 级别的 layout pass 导致 URL 反复变化、触发图片库重复请求。

**4. `@Observable` 精确追踪替代 ObservableObject：** 替代 `@Published` 广播模式。`age` 变了，只刷新读取过 `age` 的视图，没有读取 `age` 的视图完全不动。

### 6.2 内存与 CPU——不是上线后才操心的事

| 考量点 | 设计对策 |
|--------|---------|
| **大图内存** | 按控件实际尺寸请求合适分辨率，避免加载 4K 原图 |
| **视图复用** | LazyVStack 只渲染可视区域，ForEach 稳定 id 保证复用；`List` 底层有 Cell 复用池 |
| **@Observable 精确追踪** | 属性级依赖追踪，减少无用 body 调用 |
| **Task 自动取消** | `.task {}` 绑定视图生命周期，视图消失自动取消网络请求，避免后台无效计算 |
| **Actor 隔离** | `@MainActor` 保证 UI 更新在主线程，编译期静态检查消除数据竞争 |
| **图片预览内存** | 按需加载，离屏图片及时释放 |

### 6.3 网络与电量——移动端特有的考量

| 考量点 | 设计对策 |
|--------|---------|
| **无网络直达** | `NetworkMonitor`（系统 NWPathMonitor）实时感知网络状态，无网络时 `BaseContainer.execute()` 直接走 `networkUnavailable`，不发起超时等待 |
| **图片代理按需请求** | AppImage 按 pt 尺寸请求合适分辨率，减少数据传输量 |
| **请求合并防重复** | `BaseContainer.hasLoaded` + force 参数，同一页面不重复请求相同数据 |
| **Task 生命周期** | `.task {}` 视图消失自动取消，避免后台无效网络持续消耗电量 |
| **Loading 超时** | 全局 Loading 8 秒超时自动取消 + Toast 提示，防止接口卡死持续耗电 |
| **后台挂起** | `scenePhase.background` 时挂起任务、减少网络活动 |

### 6.4 Instruments 检查清单

| 工具 | 检查什么 |
|------|---------|
| **Allocations** | 内存分配是否持续增长（泄露） |
| **Leaks** | 循环引用检测 |
| **Time Profiler** | 主线程耗时调用栈 |
| **SwiftUI** | 视图 body 调用频率和范围 |
| **Energy Log** | CPU 唤醒次数和高能耗操作 |

### 6.5 并发安全——编译期保证，不是运行时祈祷

项目强制开启 Swift 6 严格并发检查（Complete Concurrency Checking），编译器静态保证数据安全：

```swift
// ✅ 所有 UI 相关状态标记 @MainActor
@Observable @MainActor
class BaseContainer { ... }

// ✅ 网络监听回调切回主线程
monitor.pathUpdateHandler = { [weak self] path in
    Task { @MainActor in
        self?.isConnected = path.status == .satisfied
    }
}

// ✅ Weak 引用防止闭包循环
// pathUpdateHandler 内用 [weak self]

// ❌ 禁止手动 DispatchQueue.main.async
// 所有异步转同步必须通过 await 处理，让编译器验证线程安全
```

核心原则：**不在代码里写任何线程调度，让 Swift 6 的编译器替你检查**。`@MainActor` 注解的类，在非主线程上下文中修改其属性会直接编译报错。

---

## 七、开发规范——写好代码的底层约束

前几章讲的是"做什么"，这一章讲的是"怎么写"。这些规则不是凭空制定的，每条规则背后都是踩过的坑或线上事故。

### 7.1 视图规范——SwiftUI 特有的几个必须知道的禁忌

**1. 用 `opacity` 而非 `if` 控制显隐：**

```swift
// ❌ if 销毁/重建视图 → 丢失动画、身份、滚动位置
if showBanner {
    BannerView()
}

// ✅ opacity 保留视图身份 → 动画连贯、状态保持
BannerView()
    .opacity(showBanner ? 1 : 0)
    .animation(.easeInOut, value: showBanner)
```

`if` 会导致 SwiftUI 图销毁和重建子视图，之前记住的所有状态（滚动位置、输入文本、动画进度）全部丢失。只有一种情况用 `if`：你**真的不需要**之前的状态——比如从"加载中"切换到"有数据"时，旧的 loading 视图确实不需要保留。

这在第二章 2.3 节深入讲过机制，这里的规范是"看完理论后怎么用"。

**2. 禁止使用 `AnyView`：**

```swift
// ❌ AnyView 类型擦除 → SwiftUI 无法 diff 比较、失去增量更新
var body: some View {
    if isLoading {
        AnyView(ProgressView())
    } else {
        AnyView(ContentView())
    }
}

// ✅ @ViewBuilder 保持类型信息 → SwiftUI 精确比较子树
@ViewBuilder
var body: some View {
    if isLoading {
        ProgressView()
    } else {
        ContentView()
    }
}
```

`AnyView` 包装的视图对 SwiftUI diff 引擎来说是一个"黑盒子"——它只知道"这是一个 AnyView"，不知道里面是什么，无法做细粒度比较，每次都会被标记为"changed"从而触发完整重建。

**3. 用 `@ViewBuilder` 提取状态分支，禁止 body 内超过 3 层 `if-else` 嵌套：**

```swift
// ❌ 深层嵌套，读代码要跟踪每个 else 属于哪个 if
var body: some View {
    VStack {
        if isLoading {
            // ...
        } else {
            if hasError {
                // ...
            } else {
                if items.isEmpty {
                    // ...
                } else {
                    // ...
                }
            }
        }
    }
}

// ✅ 每个状态独立 @ViewBuilder 方法，一目了然
var body: some View {
    VStack {
        switch pageState {
        case .loading: loadingView
        case .error: errorView
        case .empty: emptyView
        case .success: contentView
        }
    }
}
```

**一句话总结**：这三个规则的共同目标是——**让 SwiftUI 的 diff 引擎能干好它的本职工作**。不要用 `if`/`AnyView`/深层嵌套来加噪音。

### 7.2 安全规范——防御性编程不是过度工程

**枚举解码兜底——`UnknownCaseRepresentable` 协议：**

这是一个典型的事故场景：后端加了一个新的枚举值，App 没跟上版本，客户端解码时直接 crash。

```swift
// 枚举遵循该协议
enum PaymentMethod: String, Codable, UnknownCaseRepresentable {
    case wechatPay, alipay
    static var unknownCase: Self = .wechatPay
}

// Decoder 碰到 unknown 值时自动兜底为 unknownCase
// 而不是 throw DecodingError → crash
```

所有从网络或本地 JSON 解码的枚举必须遵循此协议。新枚举值上线后，未更新的旧版 App 会静默降级为兜底值，而不是闪退。**这比 Crashlytics 后修 bug 的成本低 100 倍。**

此外，Token 等敏感信息通过 `KeychainManager` 存储而非 `UserDefaults`，因为 `UserDefaults` 的 plist 在越狱设备上可被直接读取。

### 7.3 组件复用——让样式不只是拷贝粘贴

**用 `ViewModifier` 封装重复样式：**

```swift
// 定义一次
struct CardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(16)
            .background(.cardBg)
            .cornerRadius(12)
            .shadow(radius: 4)
    }
}

extension View {
    func cardStyle() -> some View { modifier(CardModifier()) }
}

// 到处使用
VStack { ... }.cardStyle()
```

相较于直接在每个 View 上写 `.padding(16)` + `.background(.cardBg)` + `.cornerRadius(12)` + `.shadow(radius: 4)`，`ViewModifier` 有三重好处：
- 视觉一致性：所有卡片长得一模一样
- 单点修改：改一次，所有卡片同步生效
- 主题切换：`CardModifier` 内引用的 `.cardBg` 是语义色，深浅模式下自动变化

同理，按钮样式统一用 `.buttonStyle()` 管理，而不是在每个 `Button` 上重复配置。

### 7.4 错误处理——分级反馈，对用户诚实

项目的错误处理是一个三层漏斗：

```
BaseContainer.execute() catch → pageState = .error(...)
                                    ↓
                            PageUnavailableView(重试按钮)

用户操作失败（按钮、表单）→ send(.toast("具体描述"))

静默刷新失败 → Logger.error() 记录，不打断用户
```

三条原则：
- **[必须]** 所有 Container 的异常由 `BaseContainer.execute()` 统一捕获，业务代码不写 try-catch。catch 后通过 `pageState = .error(...)` 驱动错误页，提供重试按钮。
- **[推荐]** 用户主动操作失败时用 `send(.toast("具体错误描述"))` 给予即时反馈——"网络异常，请稍后重试"比"操作失败"有用得多。
- **[必须]** 静默刷新（下拉刷新、页面进入时的自动请求）失败时**只记日志，不弹 Toast**。用户没有发起操作，不应该被一个莫名其妙的错误提示打断。

### 7.5 触觉反馈——用对的振感，用对的地方

iPhone 的 Taptic Engine 能为交互增加微妙的物理质感，但用错了反而廉价：

| 场景 | 触感类型 | 说明 |
|------|---------|------|
| 按钮确认（保存、发送、开关） | `Haptics.light()` | 轻量反馈，确认操作已生效 |
| 操作成功 | `Haptics.success()` | 三段式振动，比 light 更有"完成感" |
| 操作失败/错误提示 | `Haptics.error()` | 与系统的错误反馈一致，用户下意识就知道出错了 |
| 列表选项切换 | `Haptics.selection()` | 模拟拨轮手感 |

两个禁区：**页面出现（onAppear）时触发**——用户什么都没做就被振了一下，体验极差；**高频滚动时触发**——Taptic Engine 的电机来不及恢复，振动会变成噪音。

### 7.6 静态分析——编译期就发现的问题不值得留到 Code Review

项目接入 SwiftLint，`.swiftlint.yml` 纳入版本控制。所有规则写死在配置文件中，CI 流水线中集成 SwiftLint 检查，不合规代码禁止合入。

这解决了三个问题：代码风格不一致（缩进、空格、尾随逗号）；高危 API 的误用（比如 `print()` 残留到 Release 包）；以及 Code Review 中的时间浪费——格式问题机器检查，人聚焦在逻辑和架构上。

---

## 总结

这篇文章从 SwiftUI 底层机制讲到工程架构，再到日常实践和开发规范，核心思路只有一条：**利用好 SwiftUI 的设计哲学，而不是用 UIKit 的思维写 SwiftUI。**

- 理解视图身份 → 避免 if 乱用导致动画断裂
- 理解 `@Observable` → 告别无差别刷新
- MVI 架构 → 状态可预测、可测试、View 极致简单
- `.task {}` 替代 `onAppear + Task` → 自动管理生命周期
- 规范不是限制 → 是让 diff 引擎、编译器、CI 帮你把关，把精力留给真正的业务逻辑