---
title: "iOS 转 H5 开发笔记"
date: 2026-10-15T16:28:43+08:00
recommend: true
---

> 给自己的速查手册：从 Swift / SwiftUI 已有的知识出发，记下写 React 页面真正要用的东西和项目里的工程约定，目标是照着这份就能开一个新页面。内容整理自官方文档与日常工程实践；文中的目录名、模块名、命令均为示意，按自己项目的实际命名对号入座即可。

## 0. H5 开发的几个概念

先用 iOS 的脑子对一遍，这些词后面到处都是。

| 概念 | 是什么 | 类比 / 提醒 |
| --- | --- | --- |
| HTML | 页面的结构，一棵标签树 | 相当于 xib 里的视图层级，但是文本描述 |
| **DOM** | 浏览器把 HTML 解析成的对象树，JS 通过它改页面 | 类似 `UIView` 层级，但**业务里不要手动操作它**（别 `document.getElementById` 改界面），交给 React |
| **JSX** | 在 JS 里写类 HTML 的语法，用来描述 UI | 编译成 `React.createElement()` 调用（新 JSX 转换下是 `jsx()`），**不是字符串、不是模板**；`{}` 里放表达式 |
| 虚拟 DOM | 用 JS 对象描述的一份 UI，React 对比新旧差异后只更新变化的真实 DOM | 类似 SwiftUI 重算 body 后只刷新变化的部分；你不用管 diff |
| 组件 | 返回 JSX 的函数 | 对应一个 `View` / `UIView` |
| props / state | 父传子的只读入参 / 组件自己的状态 | `@State` 那套 |
| **Hooks** | `use` 开头的函数，让函数组件拥有状态、副作用、缓存等能力 | **只能顶层调用**：React 靠调用顺序对应每个 Hook 的 state 槽位，顺序一乱全部错位 |
| SPA | 单页应用，全站只有一个 `index.html`，切页面不重新加载 | 像一个 App 里 push/pop ViewController，浏览器地址栏变了但页面没重载 |
| 路由 | URL → 组件的映射（react-router v6） | 类似 `UINavigationController` 的路由表 |
| Bundle | 打包后的 JS/CSS 文件，文件名带 hash | 相当于编译产物，但用户每次访问时下载 |
| 构建 | Vite 把 `.tsx` / `.less` / 图片编译打包成静态文件 | 类似 Xcode build，产物是 `dist/` 一堆静态文件 |
| CSS Modules / less | 样式文件，`styles.xxx` 局部作用域；less 支持嵌套 | 样式和 JSX 分离，不像 SwiftUI 链式 modifier |
| rem / viewport | 移动端适配：按屏幕宽度换算根字体大小，尺寸写 rem | 类似用比例而不是写死 point |
| 合成事件 | React 包装过的事件，跨浏览器行为一致 | `onClick` 驼峰，传函数引用 |

**一次访问页面发生了什么**（把上面这些串起来，也是排查问题的主线）：

```
输入 URL → DNS / hosts 解析 → 拿到 index.html
       → 下载带 hash 的 js / css → 浏览器执行 JS
       → React 创建 DOM（首次渲染）→ useEffect 发接口 → 数据回来 setState → 重渲染
```

白屏、404、接口不通、样式错、代理抓不到包，基本都落在这条链路的某一环上。

## 1. Swift → TypeScript

### 1.1 主要区别

| 项 | Swift | TypeScript | 容易踩的 |
| --- | --- | --- | --- |
| 常量 | `let x = 1` | `const x = 1` | **Swift 的 `let` 是 TS 的 `const`** |
| 变量 | `var x = 1` | `let x = 1` | **Swift 的 `var` 是 TS 的 `let`**；TS 里的 `var` 是历史遗留，别用 |
| 类型标注位置 | `let s: String` | `const s: string` | 原始类型小写：`string` `number` `boolean`，不是 `String` |
| 可选值 | `String?`、`if let` / `guard let` | `string \| null`，判空后自动收窄 | TS 没有 `guard`，写 `if (x === null) return;` |
| 空合并 / 可选链 | `??`、`?.` | `??`、`?.` | 一样 |
| 字符串插值 | `"\(count) 张"` | `` `${count} 张` `` | 反引号 + `${}` |
| 结构体 / 对象 | `struct` 是**值类型**，赋值即拷贝 | 对象和数组都是**引用类型** | 见 1.2，React 里最致命的一条 |
| 协议 | `protocol` | `interface` / `type` | `interface` 可 `extends`；`type` 能做联合类型 |
| 带值枚举 | `enum` + 关联值，很强 | 用可辨识联合：`{type:'inc'} \| {type:'reset'}` | `switch` 里自动收窄，和 Swift 像 |
| 泛型 | `<T>` | `<T>` | 基本一致 |
| 函数 | `func f(_ a: Int) -> String` | `function f(a: number): string` / `const f = (a: number): string => ...` | 箭头函数到处都是，先习惯 |
| 闭包捕获 | `[weak self]`、`self.` | 箭头函数不绑定 `this`；普通 `function` 的 `this` 会变 | 组件里一律用箭头函数，少碰 `this` |
| 集合操作 | `map` / `filter` / `reduce` | `map` / `filter` / `reduce` | 语法从 `{ $0 }` 换成 `x => ...` |
| 解构 / 展开 | 基本没有 | `const {a, b} = obj`、`[...arr]`、`{...obj}` | **必须补**，React 里天天写 |
| 相等 | `==` 比值、`===` 比引用（class） | `===` 严格相等；对象/数组比的是**引用** | 内容一样的两对象也不相等，直接影响重渲染 |
| 错误处理 | `do / try / catch`、`throws` | `try / catch` + `Promise`；`async` 函数里 `await` | 请求失败走 `.catch` 或 `catch` |
| 异步 | `async/await`、`Task`、`@MainActor` | `Promise`、`async/await`、单线程事件循环 | 没有主线程概念，但别在渲染里做耗时活 |
| 访问控制 | `private` / `internal` / `public` | 靠 `export` 控制模块可见性 | 文件内默认私有，要给别人用得 `export` |
| 模块 | 同 target 内不用 import | **每个文件都要 `import`** | `import { useState } from 'react'` 几乎每页都有 |
| 类型强度 | 编译期强类型 | 静态检查、编译后擦除，运行时无类型 | 别用 `any` 逃逸，等于关掉检查 |

### 1.2 最要紧的一条：值类型 → 引用类型

Swift 里 `struct` 改属性得到的是新值，React 靠**引用是否变化**判断要不要重渲染，所以 JS 里必须手动造新对象：

```ts
// ✗ 引用没变，界面不刷新
list.push(x);
setList(list);

// ✓ 新引用
setList(p => [...p, x]);              // 增
setList(p => p.filter(i => i.id !== id)); // 删
setList(p => p.map(i => i.id === id ? {...i, done: true} : i)); // 改
setUser(p => ({ ...p, name: '李四' })); // 对象更新必须展开，不展开 age 就丢了
```

### 1.3 同一段代码两种写法

```swift
// Swift
let name = "张三"
var count = 0
var label: String? = nil
if let n = label { print(n) }
struct User { var name: String; var age: Int }
let u = User(name: "A", age: 18)
func greet(_ s: String) -> String { "Hi \(s)" }
let upper = ["a", "b"].map { $0.uppercased() }
```

```ts
// TypeScript
const name = '张三';
let count = 0;
let label: string | null = null;
if (label !== null) { console.log(label); }   // 自动收窄成 string
interface User { name: string; age: number }
const u: User = { name: 'A', age: 18 };
const greet = (s: string): string => `Hi ${s}`;
const upper = ['a', 'b'].map(x => x.toUpperCase());
```

**TS 对有 Swift 底子的人不难**，真正的门槛是 JS 的引用语义、解构展开、以及 `this` / 异步这几处，其余靠推断就行——泛型只在推断不出来时补，处处写满是噪音。

## 2. SwiftUI ↔ React

### 2.1 相似处

| SwiftUI | React | 说明 |
| --- | --- | --- |
| `View` (struct) | 函数组件 | 都是"返回一段 UI 描述" |
| `body` | `return <JSX>` | 声明式，只描述"这个状态下长什么样" |
| `UI = f(state)` | `UI = f(state)` | 完全同一套脑子 |
| `@State` | `useState` | 状态变 → 重算 body / 重跑组件函数 |
| `@Binding` + 回调 | `props` + 父给的回调 | 数据向下、事件向上 |
| `@EnvironmentObject` | `useContext` | 跨层传值 |
| `ObservableObject` | `useReducer` + Context / 状态库 | |
| `.onAppear` / `.onDisappear` | `useEffect` + cleanup | 挂载 / 卸载成对处理 |
| `ForEach(..., id:)` | `key` | 列表身份标识 |
| `VStack` / `HStack` | `div` + Flexbox | 见 5.1 |
| Xcode Preview | Fast Refresh | 改完即见 |

### 2.2 主要区别

| | SwiftUI | React |
| --- | --- | --- |
| 组件本体 | `struct`，`body` 是计算属性 | **函数**，每次渲染整个函数体重新执行 |
| 局部变量 | 随 view 实例存在 | **每次渲染都是新的**，跨渲染保留必须用 `useState` / `useRef` |
| 改状态 | `@State var count` 直接 `count += 1` | 只能 `setCount(c => c + 1)`，不能直接赋值 |
| 依赖追踪 | 自动 | **手动填依赖数组**，漏了就是过期值 |
| 调用约束 | 无 | **Hooks 只能顶层调用**，不能进 `if` / 循环（React 靠调用顺序存 state 槽位） |
| 双向绑定 | 有 `@Binding` | **没有**，严格单向；表单靠 `value` + `onChange` 受控 |
| 样式 | 链式 modifier 写在代码里 | 写在 `.less` / CSS 文件，用 `className` 引用，`styles.xxx` 局部作用域 |
| 生命周期 | `onAppear` 相对简单 | `useEffect` 有依赖 + 清理语义；开发模式 StrictMode 会**故意跑两遍** |
| 渲染产物 | 原生视图树 | 虚拟 DOM → Diff → 真实 DOM |
| 类型 | Swift 原生强类型 | 需要 TS 加持 |
| 状态管理 | `@StateObject` / `@Observable` 内置 | 内置较弱，大项目要第三方库 |

### 2.3 同一个页面，两版对照

```swift
// SwiftUI
struct HomeView: View {
    @State private var count = 0
    @State private var prizes: [Prize] = []
    @State private var loading = true

    var body: some View {
        VStack {
            Text("已获得 \(count) 张券")
            Button("签到 +1") { count += 1 }
            if loading { ProgressView() }
            ForEach(prizes, id: \.id) { p in Text(p.name) }
        }
        .task { await load() }
    }

    func load() async {
        prizes = (try? await fetchPrizes()) ?? []
        loading = false
    }
}
```

```tsx
// React
export default function Home(): ReactElement {
  const [count, setCount] = useState(0);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchPrizes().then(res => {
      if (!cancelled) { setPrizes(res.list); setLoading(false); }
    });
    return () => { cancelled = true; };   // SwiftUI 没有这一层
  }, []);

  return (
    <div className={styles.page}>
      <p>已获得 {count} 张券</p>
      <Button onClick={() => setCount(c => c + 1)}>签到 +1</Button>
      {loading && <Loading />}
      {prizes.map(p => <div key={p.id}>{p.name}</div>)}
    </div>
  );
}
```

差异集中在四处：`@State` 变成 `[x, setX]`、`count += 1` 变成函数式更新、`.task` 变成 `useEffect` + 竞态保护 + cleanup、modifier 变成 `className`。**把 UIKit 里 `addSubview` / `reloadData` 那套命令式习惯收起来，React 里不手动改界面。**

## 3. 语法速查

```tsx
// 组件 = 返回 JSX 的函数；props 是只读入参
interface Props { title: string; count?: number }
function Card({ title, count = 0 }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.card}>
      <h2>{title} · {count + 1}</h2>
      <button onClick={() => setOpen(!open)}>展开</button>
      {open && <p>内容</p>}
    </div>
  );
}
// <Card title="示例" />
```

| 规则 | 写法 | 和写 HTML 不同的地方 |
| --- | --- | --- |
| 类名 | `className="x"` | `class` 不能用；`for` → `htmlFor` |
| 内联样式 | `style` 收对象：外层 `{}` 是 JSX 插值、内层 `{}` 是对象字面量（如 `fontSize: 14`） | 属性名驼峰，值直接写数字或字符串 |
| 插值 | `{任意表达式}` | `if` / `for` 是语句，放不进去；写外面，里面用三元、`&&`、`map` |
| 事件 | `onClick` / `onChange` / `onSubmit` | 驼峰；**传函数引用** `onClick={fn}`，传参才 `onClick={() => fn(id)}` |
| 闭合 | `<img />`、`<input />` | 单标签必须自闭合 |
| 多根节点 | `<>...</>` 或 `<Fragment>` | 不能直接并列两个标签 |
| 注释 | `{/* ... */}` | |
| 条件 | `{flag && <A />}` / `{ok ? <A /> : <B />}` / 提前 `return` | `flag` 是 `0` 时**会把 0 渲染出来**，改成 `flag > 0 && ...` |
| 列表 | `{list.map(i => <div key={i.id}>{i.name}</div>)}` | `key` 必须稳定唯一，**别用 index**（增删排序时输入框内容会串行） |
| 表单 | `value={text}` + `onChange={e => setText(e.target.value)}` | 受控组件；`onChange` 是每次输入就触发，不是失焦 |
| 提交 | `onSubmit={e => e.preventDefault()}` | 不阻止会整页跳转 |

TS 三块写法（项目是 TS，绕不开）：

```tsx
interface ButtonProps {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}
const [user, setUser] = useState<User | null>(null);   // 推断不出才写泛型
const inputRef = useRef<HTMLInputElement>(null);        // DOM ref：泛型 + null 初值
const onChange = (e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value);
```

内联回调让 TS 自己推，抽成函数才需要显式写 `React.XxxEvent<T>`。不推荐 `React.FC`（18 起不再隐式包含 children）。

## 4. Hooks 速查

**日常只用到 6 个**：`useState` / `useEffect` / `useRef` / `useMemo` / `useCallback` / `useContext`。其余（`useReducer` / `useLayoutEffect` / `useImperativeHandle` / 18 新增的 `useTransition` / `useId` 等）用到再查。

两条铁律：**只在顶层调用**、**只在函数组件或自定义 Hook 里调用**。装 `eslint-plugin-react-hooks` 强制检查。

### useState

```tsx
const [count, setCount] = useState(0);
setCount(c => c + 1);          // 依赖旧值必须函数式；两次直接赋值只加 1
useState(() => expensiveInit()); // 惰性初始化，只跑一次
```

四个误区：① 更新是**替换不是合并**，对象要 `{...p}` 展开；② 必须**不可变**（见 1.2）；③ 依赖旧值用函数式；④ `setState` 后立刻读变量还是**旧快照**。

**state 还是 ref**：界面需要它 → `state`（变了重渲染）；只是流程控制（防重复点击锁、请求中标记）→ `ref`（改了不触发渲染）。

### useEffect

有 UIKit / SwiftUI 背景，用生命周期对照最快：

| 原来的 | Hook |
| --- | --- |
| 初始化状态 | `useState(初始值)` |
| 挂载后请求 / 订阅 | `useEffect(fn, [])` |
| props 变化后响应 | `useEffect(fn, [deps])` |
| 卸载前清定时器 / 取消订阅 | `useEffect` 的 `return` 清理函数 |

依赖数组三种：无数组 = 每次渲染后执行（别用）；`[]` = 挂载一次 + 卸载清理（最高频）；`[id]` = 挂载 + id 变化时。顺序是：渲染 → 绘制 → 跑上次的清理 → 跑新 effect。

四个典型场景：数据请求（带 `cancelled` 竞态保护）、事件订阅（成对清理）、定时器（条件守护）、同步外部系统（`document.title`、平台桥接回调注册与恢复）。

**五个高频坑**：闭包拿过期值、依赖漏填、组件内函数每次渲染都是新引用导致 effect 反复重建（用 `useCallback` 包）、effect 里直接 setState 死循环（加条件守护）、StrictMode 下 effect 跑两遍（开发模式故意的，cleanup 写对就没事，**不是 bug**）。`exhaustive-deps` 警告当错误处理。

派生值直接算，别用 effect 去同步另一份 state。

### 其余

```tsx
const ref = useRef(0);                     // 可变盒子，改了不渲染；也能接 DOM 节点
const sorted = useMemo(() => [...list].sort(cmp), [list]);  // 缓存值
const onSelect = useCallback(id => setId(id), []);          // 缓存函数引用
const theme = useContext(ThemeCtx);        // 跨层传值；只管传，不是状态管理器
```

`memo` / `useMemo` / `useCallback` 先别急着用：**先写对，测出慢再加**；`memo` 配内联对象/函数 props 等于白做。

自定义 Hook 就是 `use` 开头的函数，用来复用逻辑（项目里已有 `useAuth` 这类登录 Hook，直接调）。

## 5. 布局与常用组件

**要掌握，但不是背 API**。布局必须懂（否则写不出页面，也不知道怎么调），组件只需知道"有哪些、去哪查、怎么用受控"。

### 5.1 布局：先懂盒模型，再懂 Flexbox

每个元素都是一个盒子，从内到外：`content`（内容）→ `padding`（内边距）→ `border`（边框）→ `margin`（外边距）。项目里统一 `box-sizing: border-box`，这样设了 width 就把 padding 和 border 算在里面，和 UIKit 里设 frame 的直觉一致。

**Flexbox 是主力**，和 SwiftUI 的 Stack 基本能对上：

| SwiftUI | CSS | 说明 |
| --- | --- | --- |
| `VStack(spacing: 8)` | `display: flex; flex-direction: column; gap: 8px;` | 纵向排列 |
| `HStack(spacing: 8)` | `display: flex; flex-direction: row; gap: 8px;` | 横向排列（flex 默认就是 row） |
| `.frame(maxWidth: .infinity)` | `flex: 1` | 占满剩余空间 |
| `Spacer()` | `flex: 1` 的空 div，或 `justify-content: space-between` | 撑开 |
| `ZStack(alignment:)` | `position: relative` 容器 + 子元素 `position: absolute` | 层叠 |
| `.padding()` | `padding` | 内边距 |
| `.offset()` | `transform: translate(...)` / `position` + top/left | 位移 |
| `alignment` | `justify-content`（主轴）/ `align-items`（交叉轴） | **最容易被绕晕的一对** |

记法：`flex-direction: row` 时主轴是横的，`justify-content` 管水平对齐、`align-items` 管垂直对齐；`column` 时两者反过来。常用值：`justify-content: center | space-between | flex-start | flex-end`，`align-items: center | flex-start | stretch`。

一个最常用的骨架：

```less
.page  { display: flex; flex-direction: column; min-height: 100vh; }
.row   { display: flex; align-items: center; justify-content: space-between; }
.grow  { flex: 1; }
.center{ display: flex; align-items: center; justify-content: center; }
```

### 5.2 属性速查

| 类别 | 属性 | 常用值 |
| --- | --- | --- |
| 尺寸 | `width` `height` `min-width` `max-width` | `100%`、`100vw` / `100vh`、`auto` |
| 间距 | `margin` `padding` `gap` | 上右下左 / 上下、左右；项目里写 rem |
| 颜色 | `color` `background` / `background-color` | `#333`、`rgba(0,0,0,.5)` |
| 文字 | `font-size` `font-weight` `line-height` `text-align` | `0.28rem`、`500`、`center` |
| 圆角边框 | `border-radius` `border` `box-shadow` | |
| 布局 | `display` `flex` `flex-direction` `justify-content` `align-items` `flex-wrap` | |
| 定位 | `position` + `top/right/bottom/left` + `z-index` | `relative` / `absolute` / `fixed` / `sticky` |
| 溢出 | `overflow` `text-overflow` `white-space` | 单行省略三件套见下 |
| 其他 | `opacity` `transform` `transition` | |

单行文字省略（列表里很常用）：

```less
.ellipsis {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
```

### 5.3 移动端特有的几件事

| 事 | 怎么写 / 注意 |
| --- | --- |
| viewport | `index.html` 里必须有 `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover">`，框架已配好，别删 |
| 单位 | 项目用 **rem**，`init()` 按屏宽设置根字体大小；**别写死 px**。纯边框、`1px` 细线可以例外 |
| 安全区 | 底部横条 / 刘海：`padding-bottom: constant(safe-area-inset-bottom); padding-bottom: env(safe-area-inset-bottom);`（需 `viewport-fit=cover`） |
| `100vh` | iOS Safari 地址栏会让 `100vh` 超出可视区，全屏页优先用 `min-height: 100%` + flex，或用 `100dvh` |
| 1px 细线 | 高清屏下 `1px` 偏粗，用 `transform: scaleY(0.5)` 或伪元素处理，项目里通常已有封装 |
| 点击高亮 / 滚动 | `-webkit-tap-highlight-color: transparent;`、`-webkit-overflow-scrolling: touch;` |
| 键盘弹起 | `fixed` 底栏在软键盘弹出时会被顶飞，输入框多的页面要真机验证 |
| 横竖屏 / 字体缩放 | 别写死高度；用户系统字号放大时留意布局 |

样式组织：**CSS Modules**（`index.module.less`），类名只在本文件生效，JSX 里用 `styles.xxx`；less 可以嵌套写。别在组件里写全局 `className="title"`，会污染其他页面。

### 5.4 常用组件（antd-mobile）

不用背，知道存在、用时查官方文档即可。分两类用法：

| 组件 | 用途 | 用法 |
| --- | --- | --- |
| `Button` | 按钮 | `color="primary"`、`disabled`、`loading`、`onClick` |
| `Toast.show()` | 轻提示 | **命令式**，直接调，不是 JSX 组件 |
| `Dialog` | 确认弹窗 | `Dialog.confirm({ content })` 命令式，或 `visible` 受控 |
| `Popup` | 底部/侧边弹出层 | **受控**：`visible` + `onClose` + `onMaskClick` |
| `Mask` | 遮罩层 | 受控 |
| `List` / `List.Item` | 列表行 | 配合 `styles` 写单元格 |
| `Input` / `TextArea` / `Form` | 输入与表单 | 受控：`value` + `onChange` |
| `Tabs` | 标签页 | `activeKey` + `onChange` |
| `Swiper` | 轮播 | |
| `NavBar` | 顶部导航 | `onBack` |
| `TabBar` | 底部 tab | |
| `PullToRefresh` / `InfiniteScroll` | 下拉刷新 / 上拉加载 | 逻辑较多，照项目现有页面抄 |
| `Skeleton` / `SpinLoading` | 加载占位 | |

**受控 vs 命令式**是要分清的一点：弹层类组件自己管不了开闭，得由你的 state 决定 `visible`，关闭时回调里 `setVisible(false)`；而 `Toast.show()` 是一次性调用，不用 state。AI 生成代码时这两种经常写混。

**别自己造**：按钮、弹窗、Toast、列表、表单这些组件库里都有，手写既慢又和视觉规范不一致。

### 5.5 布局怎么调

Chrome DevTools 的 Elements 面板：选中节点能直接看盒模型（content/padding/border/margin 各自数值），`display: flex` 的容器点小图标能高亮主轴/交叉轴， Styles 面板可临时改属性实时预览——比反复改代码刷新快得多。真机上看 console 和元素，用 vConsole / eruda，或用 Safari 远程调试（Mac Safari → 开发菜单 → 选 iPhone）。

## 6. 项目里的工程约定

这一节是能不能直接干活的关键，照着做，别自己发挥。不同团队的脚手架细节不一样，下面按通用形态描述，具体命名以自己项目为准。

### 6.1 环境与依赖

- Node 用 **LTS 版本**（nvm 管理并设 default，团队统一一个版本）；包管理**统一一种**（yarn 或 npm 或 pnpm，全组一致），不混用。
- 有私有包时，registry 要指向团队指定的源，否则装包会 404；本地调试若跑 **HTTPS**，需要对应的本地证书、并配好 hosts 里的调试域名。
- 装依赖就一条命令，按 lock 文件精确安装。**铁律**：不随意删改 lock 文件；lock 冲突找维护脚手架的同事，不自己重新生成；包版本和别人不一致就删 `node_modules` 重装。

| 现象 | 原因 |
| --- | --- |
| 装包 404 / EAI_AGAIN | registry 没切到指定源 |
| 包版本和别人不一致 | 混用了另一种包管理器 |
| `node-gyp` 编译失败 | Node 版本不对 |
| 端口被占 | `lsof -i :<端口>` 找出来关掉 |

自检：Node 版本一致 ✓ / 包管理器可用 ✓ / registry 指向指定源 ✓ / hosts 已加 ✓ / 调试端口空闲 ✓。

### 6.2 目录与协作边界

一个仓库装 N 个独立 H5 项目，每个是独立 SPA；构建按项目入口逐个打包，一份产物多环境部署。

```
src/
├── common/             公共能力（改动会触发额外流程）
│   ├── init/           适配 + 埋点初始化
│   ├── auth/           登录鉴权
│   ├── request/        请求封装 / 拦截器 / mock
│   └── bridge/         平台桥接
└── projects/
    └── {一级}/{包}/      ← 只在这个目录里改
        ├── main.tsx     入口，唯一
        ├── views/       页面（tsx + module.less）
        ├── components/  私有组件
        ├── common/      api.ts / config.ts / types.ts
        └── images/
env/{环境名}/            多环境配置
```

**改动限定在自己项目目录内**，动公共目录要走额外流程。

### 6.3 入口 main.tsx

四个必须：初始化（rem + 埋点）→ `createRoot` → `BrowserRouter` 包住 → 登录态 Provider。

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { init } from '@/common/init';
import { AuthProvider, AuthGate } from '@/common/auth';
import Home from './views/home';

init();
ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter basename="一级/包">
    <AuthProvider><AuthGate>
      <Routes>
        <Route index element={<Home />} />
      </Routes>
    </AuthGate></AuthProvider>
  </BrowserRouter>,
);
```

**头号坑**：`basename` 必须与目录路径严格一致，否则路由直接 404。

### 6.4 页面写法约定

| 项 | 约定 |
| --- | --- |
| 组件 | 函数组件，**默认导出 + 显式返回类型 `ReactElement`** |
| 文件 | `.tsx`；页面放 `views/`，私有组件放 `components/` |
| 样式 | CSS Modules + less：`import styles from './index.module.less'`，用 `styles.xxx`；类名局部作用域，不污染全局 |
| 尺寸 | 用 **rem**，适配由公共初始化统一处理，别写死 px |
| UI 组件 | 用团队选定的移动端组件库（如 antd-mobile），别自己造 |
| 请求 | 走公共目录里封装好的请求层（含拦截器和 mock），别裸 `fetch` |
| 登录态 | 用现成的 `AuthProvider` / `useAuth` 一类封装 |
| 桥接 | 平台能力、JS-SDK、多环境取值都调公共目录里的现有封装 |
| 环境变量 | 配置在部署时注入（如 `window.env`），**代码里别写死域名 / 密钥** |

**别自己造的**：登录鉴权、请求层、rem 与埋点、平台桥接、多环境配置——脚手架里都已有，直接调。后续按需再补的几块（`useNavigate` / `useSearchParams` 路由深入、请求层 mock、上线 checklist）查现有实现即可。

### 6.5 命令

```
<包管理器> install                # 装依赖
<包管理器> run dev                # 起本地开发服务器
<包管理器> run build --entry=<项目> # 构建指定项目
```

CI 里一般用按 git diff 的增量构建（筛出改动的项目目录 → 逐个构建 → 部署），本地不要自己跑 CI 那条。

### 6.6 上线前 checklist

埋点、分享、多环境配置、加载态与失败重试、列表 key、权限与登录态、构建通过。

## 7. 新建一个页面：照着抄

### 7.1 步骤

1. 在自己项目的 `views/` 下建 `xxx/index.tsx` + `index.module.less`，接口放 `common/api.ts`，类型放 `common/types.ts`。
2. 在 `main.tsx` 的 `<Routes>` 里加一条 `<Route path="xxx" element={<Xxx />} />`。
3. 起本地开发服务器，打开调试地址（路径含 basename）看效果。
4. 写完过一遍 7.4 自检清单，构建能过再提交。

### 7.2 页面模板

```tsx
// views/home/index.tsx
import { useCallback, useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { Button, Toast } from 'antd-mobile';
import styles from './index.module.less';
import { fetchList } from '../common/api';
import type { Item } from '../common/types';

export default function Home(): ReactElement {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<Item[]>([]);
  const [failed, setFailed] = useState(false);
  const [count, setCount] = useState(0);

  // 用 useCallback 包：组件内函数每次渲染都是新引用，
  // 直接放进 effect 依赖会反复重建
  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetchList();
      setList(res.list);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onSign = () => {
    setCount(c => c + 1);
    Toast.show('签到成功');
  };

  return (
    <div className={styles.page}>
      <p className={styles.title}>已获得 {count} 张券</p>
      <Button color="primary" onClick={onSign}>签到 +1</Button>

      {loading && <div className={styles.tip}>加载中…</div>}
      {!loading && failed && <Button onClick={load}>加载失败，重试</Button>}
      {!loading && !failed && list.map(item => (
        <div className={styles.row} key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

```less
// views/home/index.module.less
.page  { display: flex; flex-direction: column; min-height: 100vh; padding: 0.24rem; }
.title { font-size: 0.32rem; color: #333; }
.tip   { padding: 0.4rem 0; text-align: center; }
.row   { display: flex; align-items: center; justify-content: space-between; }
```

模板里集中了最容易写错的几处：默认导出 + `ReactElement`、CSS Modules + rem、受控状态、加载/失败/列表三态、不可变更新、`key` 用 id、函数式更新 `setCount(c => c + 1)`、`useCallback` 稳住 effect 依赖。

### 7.3 路由与跳转

```tsx
const navigate = useNavigate();
navigate('/detail/1');                 // 注意 basename 前缀由 Router 处理
const { id } = useParams();            // 路径参数
const [params] = useSearchParams();    // 查询参数
```

### 7.4 自检清单

- [ ] 文件都在自己项目目录内，没碰 `common/`；`basename` 与目录一致
- [ ] 默认导出 + 返回类型 `ReactElement`；样式走 `module.less`，尺寸用 rem
- [ ] 列表 `key` 用稳定 id，不是 index
- [ ] 对象/数组更新都是**新引用**；依赖旧值用函数式更新
- [ ] `useEffect` 依赖填全、异步有清理或竞态保护、`exhaustive-deps` 无警告
- [ ] 请求 / 登录 / 桥接 / 埋点都调项目现有封装，没自己造
- [ ] 加载态、失败重试、空列表都处理了
- [ ] 本地开发服务器能打开、构建命令能过

## 8. 用 AI 生成代码：注意什么、要能看懂什么

会大量借助 AI 写代码，那就把自己定位成 **reviewer**：AI 生成的代码等于别人提的 PR，看不懂就不要合进去。它不知道项目约定，也不会替你验证。

### 8.1 先把上下文喂足

直接说"写个活动页"，出来的东西大概率跑不起来。每次带上：

- 技术栈与版本：React **18.3** + Vite 7 + TS 5 + antd-mobile + react-router v6（**明确说 18，否则它按 19 写**）
- 项目约定：默认导出 + `ReactElement`、`module.less` + rem、请求/登录/桥接走公共目录现有封装、`basename` 规则、只改自己项目目录、包管理器统一
- **最有效的一招**：把 7.2 那个页面模板，或项目里一个已上线的同类页面直接贴进去，让它"照这个结构和风格写"
- 明确禁止项：不要新增依赖、不要改 lock、不要裸 `fetch`、不要写死域名 / 密钥、不要动公共目录

### 8.2 AI 最常生成错的地方（逐条对）

| 类型 | 典型表现 |
| --- | --- |
| 版本串了 | 按 React 19 写：`ref` 直接作 prop、`use()`、Server Components、Actions、`forwardRef` 用法变化；官方文档默认 19，很容易带进来 |
| 老写法 | 类组件、`React.FC`、`PropTypes`、`ReactDOM.render` |
| 不合项目约定 | 全局 `className` 而不是 `styles.xxx`、写 px 而不是 rem、裸 `fetch` / 直接 axios、自己实现登录态、生成新文件到公共目录 |
| 依赖与工具 | 擅自换包管理器、擅自加第三方库、改 lock 文件、引入用不到的依赖 |
| React 逻辑 | `key={index}`、直接 `push` 后 `setState`、对象更新不展开、`onClick={fn()}` 立即执行、useEffect 依赖漏填 / 无 cleanup / 在 effect 里 setState 死循环 |
| 臆造 API | 编出不存在的组件名或属性（尤其 antd-mobile 不同版本的 `Toast.show` / `Dialog` 用法、受控 vs 命令式写混） |
| 类型糊弄 | 满屏 `any`、`as any`、类型断言掩盖真实错误 |
| 只给快乐路径 | 没有 loading / failed / 空态、没有竞态保护、没有错误边界、快速连点不设防 |
| 配置硬编码 | 把 baseUrl、密钥、域名写死在代码里 |

### 8.3 必须能看懂的最低限度

不要求手写，但要能判断对错，否则只能盲信：

1. **组件边界与数据流**：props 从哪来、state 放在哪一层、谁触发更新、回调往上传给谁
2. **每个 Hook 在干嘛**：useState 存什么、useEffect 何时跑、依赖数组为什么是这几个、cleanup 清了什么
3. **渲染逻辑**：条件渲染判断、`map` 出来的列表、`key` 取的值
4. **请求链路**：`load` 什么时候调用、三态怎么切、错误怎么兜、会不会重复请求
5. **import 来源**：哪些来自 `react`、哪些来自组件库、哪些来自项目公共目录——**看到陌生包名先查是不是项目里真有的**
6. **样式对应**：`styles.xxx` 能不能在 less 里找到、单位是不是 rem
7. **类型定义**：`interface` / `type` 描述的结构和接口返回对不对得上
8. **改动范围**：diff 里改了哪些文件，有没有越界到 `common/`、有没有动 lock、有没有多出依赖

这些恰好就是第 3、4 节的内容——所以语法和 Hooks 不能跳，只是不要求背。

### 8.4 验证：能跑 ≠ 对

- `tsc` / lint 无报错，`exhaustive-deps` 无警告
- 浏览器 console 无报错、无 key 重复、无 StrictMode 双执行导致的重复请求
- 断网 / 接口报错 / 空数据 / 快速连点各试一遍
- 真机看一眼（见第 9 节），尤其键盘、安全区、滚动
- 构建命令能过
- **提交前逐行看 diff**，确认没有 8.2 表里那些东西

一句话：AI 负责产量，你负责正确。看不懂的地方就让它解释，或者回到官方文档核一下。

## 9. 真机调试：Mac 网络共享 + Charles

页面在 Mac 上跑得好好的，手机上看样式、键盘、安全区、微信/App 内打开才准。本地开发服务器跑在 Mac 本机 **HTTPS 443**，hosts 里把调试域名指到本机，手机没法自己解析，所以让手机连 Mac 共享出来的 Wi-Fi，再把流量代理到 Mac 上的 Charles——域名由 Mac 侧解析，hosts 配置才生效。

### 9.1 Mac 侧：共享网络

1. **系统设置 → 通用 → 共享 → 互联网共享**（旧版 macOS 在「系统偏好设置 → 共享」）。
2. 「共享以下来源的连接」选 Mac 正在上网的口（有线 / Wi-Fi），「用以下端口共享给电脑」勾 **Wi-Fi**，点「Wi-Fi 选项」设名称和密码。
3. 打开互联网共享开关。Mac 此时相当于一台路由器，手机和它必定同网段。
4. 如果手机和 Mac 能连同一个普通 Wi-Fi，其实可以跳过共享，直接走第 9.3 步；网络有隔离、或需要 Mac hosts 生效时才用共享。

### 9.2 Mac 侧：Charles 设置

| 位置 | 设置 |
| --- | --- |
| `Proxy → Proxy Settings` | 端口默认 **8888**（记住它）；勾 Enable transparent HTTP proxying |
| `Proxy → SSL Proxying Settings` | 勾 **Enable SSL Proxying** → Add → Host 填调试域名（或 `*` 全抓）、Port `443`。只填要调的域名，少抓无关流量 |
| `Help → SSL Proxying → Install Charles Root Certificate` | 在 Mac 装根证书；打开「钥匙串访问」找到它 → 双击 → 信任 → **始终信任** |
| `Help → SSL Proxying → Install Charles Root Certificate on a Mobile Device or Remote Browser` | 会提示手机访问 `chls.pro/ssl`，并显示要填的 Mac IP |
| `Help → Local IP Address` | 查 Mac 当前 IP；Mac 做路由器时网关一般是 `192.168.2.1`，手机常是 `192.168.2.2`，实际以这里为准 |

### 9.3 iPhone 侧：连 Wi-Fi + 手动代理

1. 设置 → 无线局域网 → 连上 9.1 里 Mac 共享的那个 Wi-Fi。
2. 点该 Wi-Fi 右边的 ⓘ → 滑到底「HTTP 代理」→ 选 **手动**：
   - 服务器：`192.168.2.1`（填 9.2 查到的 Mac IP）
   - 端口：`8888`
   - 身份验证：关闭
3. 存储。此时 Charles 会弹窗问是否允许该设备连接，点 **Allow**，不点就抓不到。

### 9.4 iPhone 侧：装证书并「完全信任」

HTTPS 不装证书只能看到 `unknown` / 乱码。两步都要做，第二步最容易漏：

1. iPhone 用 **Safari** 打开 `chls.pro/ssl` → 允许下载描述文件。
2. 设置 → 通用 → **VPN 与设备管理** → 找到 Charles Proxy 描述文件 → 安装（输锁屏密码）。
3. **设置 → 通用 → 关于本机 → 证书信任设置 → 打开 Charles Proxy CA 的「完全信任」**。iOS 10.3 之后不装这步等于没装，装了描述文件也照样乱码。

### 9.5 开始调试

iPhone 用 Safari 打开 `https://调试域名/一级/包/`（路径含 basename）。Charles 里就能看到请求列表、请求头/响应体，接口对不对、返回结构对不对一眼可查。要看页面 console / 元素，用 vConsole（或 eruda），或 Mac Safari → 开发菜单 → 选你的 iPhone 做远程调试。

| 现象 | 排查 |
| --- | --- |
| 手机连上 Wi-Fi 但上不了网 | 代理 IP / 端口写错、Charles 没点 Allow、Mac 防火墙拦了、Charles 没在监听 |
| HTTPS 显示 unknown / 乱码 | 证书没装、**没开完全信任**、SSL Proxying 没加该域名、Mac 根证书没设始终信任 |
| 调试域名打不开 | hosts 只在 Mac 生效，域名必须由 Charles 在 Mac 侧解析；必要时用 `Tools → DNS Spoofing` / `Map Remote` 指到 Mac |
| 个别 App 里抓不到 | App 可能做了 SSL Pinning（证书绑定），换浏览器/Safari 验证页面本身 |
| 443 端口冲突 | 本地开发服务器占 443，和 Charles 的 8888 不冲突；被别的进程占了用 `lsof -i :443` 清掉 |
| 抓包慢 / 噪音大 | SSL Proxying 只加目标域名，关掉无关设备的代理，用 Filter 过滤 |

**收尾**：调完把 iPhone 的 HTTP 代理改回「关闭」，否则断开 Charles 后手机就没网了；关掉 Mac 互联网共享；不用的描述文件从「VPN 与设备管理」里删掉，别让根证书长期留在手机上。

## 10. 部署发布

iOS 里发版是打包 IPA → 上传 → 审核 → 灰度 → 全量；H5 完全不是这套：**没有二进制、没有审核、没有版本号**，构建产物就是一堆静态文件，放到服务器 / CDN 上，用户下次打开 URL 就是新版本。好处是改完立刻生效，坏处是一出错也立刻全量，回滚靠重新部署上一版产物。

| iOS | H5 |
| --- | --- |
| Xcode Archive → IPA | `build` → `dist/` 静态文件 |
| App Store 审核 | 无，部署即生效 |
| TestFlight / 灰度 | 靠环境（测试 / 预发 / 生产）和 CDN 灰度控制 |
| 用户手动更新 | 用户每次打开拉最新，缓存控制生效时机 |
| 回滚下架重发 | 重新部署上一版产物 |

### 10.1 构建产物是什么

`build --entry=<项目>` 把 `.tsx` / `.less` / 图片编译成 `index.html` + 带 hash 的 `js` / `css` + 静态资源。文件名带 hash 是为了**缓存**：内容变了文件名才变，所以 js/css 可以长期缓存，而 `index.html` 必须不缓存或短缓存，用户才能拿到新的资源引用。

### 10.2 一份产物，多环境部署

常见做法是**构建产物与环境解耦**：在部署时注入一份运行时配置（如 `window.env`，含接口 baseUrl、密钥等），同一份产物可以分别部署到测试 / 预发 / 生产。所以**代码里绝对不能写死域名和密钥**，一律从运行时配置取——这也是 6.4 那条约定的原因。

### 10.3 CI 增量构建

流水线大致是：

```
git diff 对比本次提交改动的文件
  → 正则筛出 src/projects/{一级}/{包} 目录
  → 目录去重排序 → 装依赖
  → 逐个增量构建
  → 部署
```

只构建改动的项目，所以**改动越界（动了公共目录或别人的目录）会一眼被看出来**，这也是协作边界卡得严的原因。本地不要自己跑 CI 那条命令。

### 10.4 部署后必须验的几件事

- 路径含 `basename`，直接打开子路由（如 `/一级/包/detail/1`）不能 404。history 模式路由需要服务器把所有路径 fallback 到 `index.html`，否则**刷新就 404**——这是 H5 特有的坑，和 6.3 的 basename 一起出现
- 资源 js/css 无 404、无白屏；CDN 缓存是否刷新、用户强刷后是否生效
- `window.env` 指向的接口环境对不对（生产页连到测试接口是常见事故）
- 埋点上报、分享配置、登录态、HTTPS 下无混合内容（http 资源被拦）
- 真机（含微信 / App 内置 WebView）打开一遍

### 10.5 出问题的定位顺序

按第 0 节那条链路倒着查：白屏看 console 和资源 404 → 接口不通看 Charles 抓包（第 9 节）→ 数据不对看 `window.env` 和返回结构 → 样式错看 CSS Modules 类名和 rem → 只有真机复现就看 WebView 差异、键盘、安全区。

## 11. 版本提醒与资料

**项目用的是 React 18（18.3），`react.dev` 现在默认展示 React 19 文档**。看官方文档时切到 18 快照，或直接看 `18.react.dev`，否则会被 19 的变化搞混（`ref` 可直接作 prop、不必再 `forwardRef`、`use()`、Server Components、Actions）。18 里 `createRoot` 是启用并发能力的前提，旧的 `ReactDOM.render` 等于跑在 17 兼容模式；反过来 `Component` / `PureComponent` 类组件只在维护老代码时碰到，新代码一律函数组件。AI 生成代码时也记得强调 18。

| 用途 | 链接 |
| --- | --- |
| 官方 Quick Start（覆盖日常 80%） | https://react.dev/learn |
| React 18 版本快照（对齐项目版本） | https://18.react.dev |
| API 参考 / TS 指南 | https://react.dev/reference/react 、 https://react.dev/learn/typescript |
| 补 JS 语法（ES6+、解构、异步） | https://zh.javascript.info/ |
| 查 HTML / CSS / DOM / Flexbox | https://developer.mozilla.org/zh-CN/ |
| antd-mobile 组件文档 | https://mobile.ant.design/ |
| CSS Flexbox 小抄 | https://css-tricks.com/snippets/css/a-guide-to-flexbox/ |
