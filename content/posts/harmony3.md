---
title: "鸿蒙开发指南"
date: 2024-04-25 15:09:29 +0800
draft: false
---

## 基础知识

HarmonyOS 主推基于 ArkTS 的声明式开发范式和 Stage 应用模型，开发工具为 DevEco Studio。

### 应用程序包

鸿蒙应用采用多 Module 设计机制，支持模块化开发和多设备适配，每一个 Module 可以独立编译，实现特定功能，并在 Module 配置文件中指定适配设备类型，应用市场分发应用包时，会根据设备类型做筛选和匹配，从而将不同的包合理的组合和部署到对应的设备上。

Module 按照使用场景分为两种类型

- Ability：用于实现应用的功能和特性，编译后生成以 .hap 为后缀的 HAP（Harmony Ability Package）包，HAP 包可以独立安装和运行，一个应用可以包含一个 entry 类型的 HAP 包或在这基础上再包含一个或多个 feature 类型的 HAP 包

    - entry：应用的主模块，提供应用的基础功能，编译后生成 entry 类型的 HAP，每个应用分发到同一类型的设备上的应用程序包，只能包含唯一一个 entry 类型的 HAP
   
    - feature：应用的动态特性模块，作为应用能力的扩展，可根据用户需求和设备类型进行选择性安装，编译后生成 feature 类型的 HAP，一个应用中可以包含一个或多个 feature 类型的HAP，也可以不包含

- Library：用于实现代码和资源的共享，Library 类型的 Moudle 可以被其他多个 Moudle 引用

    - Static Library：编译后生成以 .har 为后缀的静态共享包 HAR（Harmony Archive）
  
    - Shared Library：编译后生成以 .hsp 为后缀的动态共享包 HSP（Harmony Shared Package），还会生成一个 .har 文件，包含 HSP 对外导出的接口，其他模块需要通过 .har 来引用 HSP 的功能，HSP 在运行时按需加载，有助于降低包大小，但会影响应用的启动时间
  
    - 两者区别：HAR 如果被多个 Moudle 引用，那么编译产物中会存在多份相同拷贝，应用包大小会增加，HSP 只会存在一份，HAR 还可以独立打包发布供其他应用使用，HSP 不可以

![HARHSP](/images/harmony/HARHSP.png "HARHSP")

在 DevEco Studio 中创建工程后，项目结构如下

![工程结构](/images/harmony/project.png "工程结构")

- AppScope/[app.json5](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/app-configuration-file-0000001820999529)

- Module/src/main/[module.json5](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/module-configuration-file-0000001820879553)

- [obfuscation-rules.txt](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/ide-build-obfuscation-0000001731754312)

- resources 资源目录下可存放字符串、颜色等基础元素，和图片、布局等资源文件
   
    - 图片、音视频可以放到 base/media 目录下，base 目录中的资源文件会被编译成二进制文件，并赋予资源文件ID，在代码中可通过指定资源类型和资源名称引用（$r('app.type.name')）
   
    - rawfile 和 resfile 目录中的资源文件会被直接打包进应用以及沙盒目录，资源不经过编译，也不会赋予资源文件ID，需要通过指定文件路径和文件名引用，更适合存放大些的文件（$rawfile('images/filename.png')）

不同类型的 Module 编译后会生成对应的 HAP、HAR、HSP 文件，ets 目录中的 ArkTS 源码会编译生成 .abc 文件存放其中，AppScope 的资源文件会合入到 Module 对应目录，遇到重名时保留 AppScope 中的，app.json5 文件中的字段会合入到 module.json5 文件中。

一个应用中所有 .hap 与 .hsp 文件合在一起称为 Bundle，当应用发布上架到市场时，需要要将 Bundle 打包成 .app 后辍的 App Pack 文件，DevEco Studio 会生成 pack.info 文件用于描述 app 包内相关 HAP 和 HSP 信息，.app 包以及 .har 和 .hsp 都签名后就可以上架分发安装了。

![编译发布与上架部署流程图](/images/harmony/build.png "编译发布与上架部署流程图")

### 动态 import

动态 import 支持条件延迟加载和部分反射功能，可以提升页面的加载速度，如果希望根据条件导入模块或者按需导入模块，可以使用动态导入代替静态导入，下面是可能会需要 [动态导入](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/arkts-dynamic-import-0000001829010166) 的场景

- 静态导入的模块很明显的降低了代码的加载速度且被使用的可能性很低，或者并不需要马上使用它

- 静态导入的模块很明显的占用了大量的系统内存且被使用的可能性很低

- 当被导入的模块，在加载时并不存在，需要异步获取。

- 当被导入的模块说明符，需要动态构建（静态导入只能使用静态说明符）

- 当被导入的模块有副作用（这里的副作用，可以理解为模块中会直接运行的代码），这些副作用只有在触发了某些条件才被需要时

### 快速修复

在不中断正在运行的应用的情况下（即不需要重启应用），修复应用的缺陷，优势在小、快和用户体验好，快速修复包使用规则

- 仅支持修复应用的 ArkTS 和 C++ 代码，对应的文件为 .abc 文件和 .so 文件，不支持对资源修复

- 不支持新增 .abc 文件和 .so 文件

- 要确保对应应用包已安装

- 快速修复包中配置的包名和应用版本号必须和已安装的包名和版本号应用相同

- 如果已经部署过快速修复包，新部署的快速修复包的版本号必须大于之前快速修复包的版本号

- 快速修复包的签名信息和待修复的应用的签名信息必须一致

- 新的应用版本发布安装时，会清理掉快速修复包

快速修复包的端到端发布部署流程：

- 通过 DevEco Studio 基于原应用的源码和修复后的源码编译后得到差异部分，根据差异部分生成快速修复文件后签名

- 将快速修复包上架到应用市场，应用市场通过验证签名、风险扫描和拆包重签名后进行分发

- 设备侧的应用市场客户端检测到应用市场服务器端有新上架的快速修复包会下载最新版本的快速修复包，接着通过系统中的包管理服务来安装部署快速修复包

- 快速修复包部署完成后，再由快速修复引擎触发应用使用快速修复包，进而保证用户使用到问题修复后的功能

### ArkTS

ArkTS 基于 TS 语言，加上了声明式 UI 语法和状态管理机制（响应式编程），与 TS 和 JS 最大不同是它强制使用静态类型，也就是说程序中变量的类型在实际运行前就是确定的，编译器可以验证代码的正确性，从而减少运行时的类型检查，有助于性能提升，ArkTS 代码在运行前就编译和优化后生成可执行文件，不像 JS 那样边运行程序边解释代码。

[ArkTS 语法](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/introduction-to-arkts-0000001774279590) 和很多现代语言很像，下面从 Swift 语言角度比较，列出几个区别比较大的地方

- let age: number = 0 （let 表示变量，const 表示常量，整数和浮点数都用 number，最好在初始化时指明 0 或 0.0）

- 100 == '100' // true（先转换为相同类型再比较，优先转成 number）

- 100 === '100' // false（类型不一样就是 false）

- 类的方法和属性的可见性修饰符默认为 public

- import 导入 Kit 时不要用 import *，这样会导致编译后 HAP 包过大

- null 表示对象有值，但值是空的，undefined 表示变量没有设置值

- Promise 和 async/await 提供异步并发能力（异步代码在执行到一定程度后会被暂停，以便在未来某个时间点继续执行，这种情况下，同一时间只有一段代码在执行），适用于单次 I/O 任务的开发场景。TaskPool 和 Worker 提供多线程并发能力，适用于 CPU 密集型任务、I/O 密集型任务和同步任务等并发场景

- [声明式 UI 开发](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-basic-syntax-overview-0000001820879569-V5)

## 开发

鸿蒙开发文档中介绍了其提供的数十种服务 Kit，下面重点介绍 Ability 和 ArkUI

### Ability Kit（程序框架服务）

Ability Kit 提供了应用程序开发和运行的应用模型，它提供了应用程序必备的组件和运行机制，开发者可以基于一套统一的模型进行应用开发，使应用开发更简单、高效，使用场景如下：

- 应用的多 Module 开发：应用可通过不同类型的 Module（HAP、HAR、HSP）来实现应用的功能开发。其中，HAP 用于实现应用的功能和特性，HAR与HSP用于实现代码和资源的共享

- 应用内的交互：应用内的不同组件之间可以相互跳转。比如，在支付应用中，通过入口 UIAbility 组件启动收付款 UIAbility 组件

- 应用间的交互：当前应用可以启动其他应用，来完成某个任务或操作。比如启动浏览器应用来打开网站、启动文件应用来浏览或编辑文件等

- 应用的跨设备流转：通过应用的跨端迁移和多端协同，获得更好的使用体验。比如在平板上播放的视频，迁移到智慧屏继续播放

#### Stage 模型开发

- UIAbility 和 ExtensionAbility 这两种组件都有具体的类承载，支持面向对象的开发方式

    - UIAbility 组件是一种包含 UI 的应用组件，主要用于和用户交互，它的生命周期只包含创建/销毁/前台/后台等状态，与显示相关的状态通过 WindowStage 的事件暴露给开发者

    - ExtensionAbility 组件是一种面向特定场景的应用组件，目前用于开发卡片和输入法等场景

- WindowStage 会与 UIAbility 绑定，UIAbility 实例通过 WindowStage 持有了一个主窗口，该主窗口为 ArkUI 提供了绘制区域

- Context 及其派生类向开发者提供在运行期可以调用的各种资源和能力，如获取应用文件路径等

- AbilityStage，每个 Entry 类型或者 Feature 类型的 HAP 在运行期都有一个 AbilityStage 类实例

- 消息传递载体 Want 是对象间信息传递的载体，可以用于应用组件间的信息传递，有显示 Want 和隐式 Want 两种类型，当调用方传入的 want 参数中指定了 abilityName 和 bundleName 则称为显式 Want。

#### 程序访问控制

系统通过访问控制的机制，来避免数据或功能被不当或恶意使用，当前访问控制的机制涉及多方面，包括应用沙箱、应用权限、系统控件等方案。

- 应用沙箱：应用程序均部署在受保护的沙箱中，通过沙箱的安全隔离机制，可以限制应用程序的不当行为（如应用间非法访问数据、篡改设备等），每个程序都拥有唯一的 TokenID，系统基于此 ID 识别与限制应用的访问行为。

- 应用权限：系统根据应用的 APL（Ability Privilege Level，元能力权限等级）等级设置进程域和数据域标签，并通过访问控制机制限制应用可访问的数据范围，从而实现在机制上消减应用数据泄露的风险，不同 APL 等级的应用能够申请的权限等级不同，且不同的系统资源（如：通讯录等）或系统能力（如：访问摄像头、麦克风等）受不同的应用权限保护。
   
    - 申请应用权限：权限的授权方式分为 user_grant 和 system_grant，如果在应用中申请了 system_grant 权限，那么系统会在用户安装应用时，自动把相应权限授予给应用，user_grant 权限需要首先在 module.json5 配置文件中声明并给出使用理由，然后当用户在应用中操作相关功能时，先检查当前用户是否已经授权过，没有则拉起授权弹框，在用户授权后再进行下一步操作
  
    - 应用权限列表：有“对所有应用开放”和“允许 ACL 跨级别申请”两种，通常拥有低 APL 等级的应用默认无法申请更高等级的权限，可以在应用市场申请发布 Profile 时提交申请 ACL 权限
   
    - 应用权限组列表：当应用请求权限时，同一个权限组的权限将会在一个弹窗内一起请求用户授权，用户同意授权后，权限组内权限将被统一授权，例如图片的读和写两个权限可以一起申请

- 系统控件：提供了系统 Picker、安全控件等临时授权的方式替代权限申请，在特定的场景中，应用无需向用户申请权限也可临时访问受限资源，实现精准化权限管控，更好地保护用户隐私。
   
    - Picker：音频、照片、文件、联系人、相机
  
    - 控件：安全控件是系统提供的一组系统实现的 ArkUI组件
      
        - 粘贴（PasteButton）：读取剪贴板
      
        - 保存（SaveButton）：可直接将图片、视频等保存到指定媒体库
      
        - 位置（LocationButton）：仅在前台场景需要使用位置信息时使用，如定位城市

### ArkUI（方舟UI框架）

#### 布局

- 线性布局（Row、Column）：线性排列时优先考虑此布局
  
    - 可以用 space 属性控制间距
  
    - 通过 alignItems 控制对齐方式
  
    - 通过 justifyContent 设置布局中组子元素在窗口主轴上的排列方式
  
    - 用空白填充组件 Blank，在容器主轴方向自动填充空白空间，达到自适应拉伸效果
   
    - 当一屏无法完全显示子元素时，可以在 Column 或 Row 组件的外层包裹一个可滚动的容器组件Scroll 来实现可滑动的线性布局

- 层叠布局（Stack）：堆叠效果时优先考虑此布局，层级关系可以通过 zIndex 属性改变，zIndex 值大的组件会覆盖在 zIndex 值小的组件上方

- 弹性布局（Flex）：在子组件需要计算拉伸或压缩比例时优先使用此布局
   
    - 设置参数 direction 设置主轴方向，从而控制子元素的排列方向
   
    - wrap 属性控制当子元素主轴尺寸之和大于容器主轴尺寸时，Flex 是单行布局还是多行布局
   
    - flexBasis 设置子元素在父容器主轴方向上的基准尺寸，还可以设置成 auto 来做自动拉伸    
  
    - flexGrow 用于设置父容器的剩余空间分配给此属性所在组件的比例

- 相对布局（RelativeContainer）：在页面元素分布复杂或通过线性布局会使容器嵌套层数过深时推荐使用，子元素支持指定兄弟元素作为锚点，也支持指定父容器作为锚点，还可以设置水平和竖直上的依赖关系，为了明确定义锚点，子元素还需要设置 ID

- [栅格布局（GridRow、GridCol）](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-layout-development-grid-layout-0000001839838516-V5?catalogVersion=V5)：栅格是多设备适配场景下的辅助定位工具，GridRow 为栅格容器组件，需与栅格子组件 GridCol 在栅格布局场景中联合使用，栅格系统以设备的水平宽度（屏幕密度像素值，单位 vp）作为断点依据，定义设备的宽度类型，栅格系统默认断点将设备宽度分为 xs、sm、md、lg 四类，通过 breakpoints 自定义修改断点的取值范围后可再启用 xl，xxl 两个断点，GridRow 中通过 columns 设置栅格布局的总列数，默认值为 12，即任何断点下，栅格布局被分成 12 列

- 媒体查询（@ohos.mediaquery）：可根据不同设备类型（圆形屏，大小屏等）或同设备在分屏或横竖屏切换同时修改页面布局

- 列表（List）：显示结构化、可滚动的信息，可以用 space 参数做列表项间距，可以用 divider 属性做列表项间的分隔线，可以用 ListItemGroup 来做列表分组，并配合 sticky 属性可以实现列表标题的滚动悬停效果

- 网格（Grid）：具有较强的页面均分能力、子元素占比控制能力，Grid组件支持自定义行列数和每行每列尺寸占比、设置子组件横跨几行或者几列

- 轮播（Swiper）：用于实现广告轮播、图片预览等，可以通过属性控制是否循环播放和是否自动轮播

#### 组件

- Button：支持带 loading 样式

- Toggle：支持带勾选样式

- Progress：支持条形、圆形等进度条

- Text：支持添加点击事件和跑马灯效果

- TextInput：支持密码输入模式

- Image：支持本地图片和网络图片，默认为异步加载，也可设置成同步加载，从而避免出现闪烁

- CustomDialog：通过此装饰器来自定义弹窗页面

- Video：用来做视频播放功能

- Popup：通过 bindPopup 属性实现气泡弹窗功能

#### 页面路程由和导航

[Navigation](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-navigation-navigation-0000001885999037-V5) 组件一般作为页面的根容器，包括单页面、分栏和自适应三种显示模式，默认为自适应模式，当设备宽度大于 520vp 时组件采用分栏模式，否则采用单页面模式。

- 鸿蒙推荐使用 Navigation 路由栈 NavPathStack 控制页面跳转。

- 通过 menus 属性在组件右上角添加菜单按钮，竖屏下最多显示 3 个图标，横屏最多五个，多余的图标会被放入自动生成的“更多”图标

- 将页面的 NavDestination 容器的 mode 属性设置为 NavDestinationMode.DIALOG 来实现弹窗效果

[Tabs](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-navigation-tabs-0000001839838540-V5) 组件可以实现页面项部切签导航，也可以实现 app 的底部切签导航

### 其它 Kit

- Account Kit（华为帐号服务）：提供一键快捷登录功能，并实现服务的跨应用和设备间的自由流转，当应用支持第三方帐号登录或元服务内存在帐号体系时，app 必须提供华为账号登录功能才可以上架应用市场，HarmonyOS 提供两种华为帐号登录方式，官方推荐使用华为帐号登录页快速实现登录功能，也可以在自定义的登录页上集成华为帐号的快速登录按钮

- Ads Kit（广告服务）：依托华为终端提供流量变现服务，同时为广告主提供广告服务

- ArkData（方舟数据管理）：提供数据存储、管理和同步能力，数据管理包括用户首选项、键值型数据管理、关系型数据管理、分布式数据对象、跨应用数据管理和统一数据管理框架。通过对数据库文件备份和加密来保护数据，数据跨设备同步时，数据管理基于数据安全标签和设备安全等级进行访问控制，在本设备的数据安全标签不高于对端设备的设备安全等级时，数据才能同步

- Asset Store Kit（关键资产存储服务）：提供了对长度较短的用户敏感数据（密码、Token、身份证号）的安全存储及管理能力，加/解密使用 AES256-GCM 算法

- ArkWeb（方舟Web）：提供了 Web 页面 [加载](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/web-page-loading-with-web-components-0000001820999889)、[交互](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/4e2d_u4f7f_u7528_u524d_u7aef_u9875_u9762javascript-0000001820999897) 和 [调试](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/web-debugging-with-devtools-0000001774279958) 等能力，可以进行上传下载操作，在配置相关权限后还可以使用定位、打印、摄像头和麦克风等功能。

- AVSession Kit（音视频播控服务）：提供了音视频的展示和控制能力

- Background Tasks Kit（后台任务开发服务）：退至后台的应用如果要继续活动，可能会造成设备耗电快、用户界面卡顿等问题，所以退至后台的应用进程会被挂起，当系统资源不足时还会终止部分应用进程以回收资源，同时，为了保障后台音乐播放、日历提醒等功能的正常使用，系统提供了规范内受约束的后台任务，扩展应用在后台运行时间

- Basic Services Kit（基础服务）：提供剪贴板读写、文件上传下载（支持断点续传）、文件压缩、文件打印、进程间/线程间通信、设备信息管理、应用帐号管理等能力

- Call Kit（通话服务）：提供的给 VoIP 类应用提供 ArkTS API，管理 VoIP 类应用通话，做到VoIP类应用来电体验一致

- Camera Kit（相机服务）：开发相机应用，应用通过访问和操作相机硬件，实现基础操作，如预览、拍照和录像；还可以通过接口组合完成更多操作，如控制闪光灯和曝光时间、对焦或调焦等。

- Core File Kit（文件基础服务）：提供访问和管理应用文件和用户文件的能力，系统在内部存储空间为应用映射出一个专属的“沙箱目录”，用于隔离其它应用，并限制应用可见文件数据范围

- Connectivity Kit（短距通信服务）：提供使用蓝牙、WLAN、NFC 通信服务

- Contacts Kit（联系人服务）：提供联系人管理能力

- Core Speech Kit（基础语音服务）：支持文本转语音和语音识别能力，目前仅支持中文普通话

- Core Vision Kit（基础视觉服务）：可识别图像中的文字信息，目前支持中、英、日、韩文字

- Crypto Architecture Kit（加解密算法框架服务）：提供了加解密算法框架服务，支持 AES、SHA 等加解密算法

- Data Guard Kit（数据保护服务）：为企业安全管控类 MDM 应用提供统一企业关键信息资产（KIA）文件的识别和外发管控能力，支撑企业构建完整的数据防泄漏解决方案，实现企业数据资产可知、可控、可追溯

- Live View Kit（实况窗服务）：支持应用将订单或者服务的实时状态信息变化在设备的关键界面展示，例如电影上映提醒

- Location Kit（位置服务）：定位用户终端设备的位置

- Map Kit（地图服务）：通过高德地图提供服务，中国大陆、中国香港和中国澳门使用 GCJ02 坐标系，中国台湾和海外使用 WGS84 坐标系

- Media Library Kit（媒体文件管理服务）：提供了管理相册和媒体文件的能力，包括照片和视频，帮助应用快速构建图片视频展示和播放能力

- Network Kit（网络服务）：提供了 HTTP、Socket 传输功能和网络连接管理功能，如连接的优先级管理、网络质量评做、网络连接状态变化等功能

- Notification Kit（用户通知服务）：当应用处于前台运行时向用户发布本地通知，转为后台时本地通知发布通道关闭，需要接入 Push Kit 进行云侧离线通知的发布

- Online Authentication Kit（在线认证服务）：遵循FIDO（Fast Identity Online）和IIFAA（ 互联网可信认证联盟）标准规范，提供免密身份认证的移动端能力，用生物特征（指纹/3D人脸）代替密码，实现免密登录、免密支付等业务场景

- Payment Kit（华为支付服务）：只支持实物商品和服务的支付，虚拟物品需要使用 IAP Kit（应用内支付服务）

- Performance Analysis Kit（性能分析服务）：为开发者提供应用事件、日志（HiLog）、跟踪分析工具，可观测应用运行时状态，用于行为分析、故障分析、安全分析、统计分析，帮助开发者持续改进应用体验

- Push Kit（推送服务）：消息推送平台，建立了从云端到终端的消息推送通道

- Scan Kit（统一扫码服务）：把持远距离扫码，同时还针对多种复杂扫码场景（如暗光、污损、模糊、小角度、曲面码等）做了识别优化

- Store Kit（应用市场服务）：可以在应用内打开应用市场的应用详情页面来下载和更新应用，也可以通过 API 加载动态模块

- Universal Keystore Kit（密钥管理服务）：提供各类密钥的统一安全操作能力，包括密钥管理（密钥生成/销毁、密钥导入、密钥证明、密钥协商、密钥派生）及密钥使用（加密/解密、签名/验签、访问控制）等功能

- User Authentication Kit（用户认证服务）：基于用户在设备本地注册的锁屏口令、人脸和指纹来认证用户身份，可用于各种鉴权场景，如应用内帐号登录、支付认证，恢复出厂设置等

## 工具

DevEco Studio 具有基本的代码开发、编译构建、运行调试、性能调优、测试和发布功能，还支持多端双向实时预览和手机设备模拟仿真功能。

- 启用中文化插件：在设置中选择 Plugins，然后在 Installed 页签中搜索 Chinese，然后点击 Enable 并重启开发工具

- 签名设置：点击文件中的项目结构，在 SigningConfigs 里勾选“Support HarmonyOS”和“Automatically generate signature”，登录后便会完成自动签名，也可以 [手动设置签名](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/ide-signing-0000001587684945)

- 代码跳转：按住 Command，单击代码中引用的类、方法、参数、变量等名称会自动跳转到定义处，若单击定义处的类、变量等名称，当仅有一处引用时，可直接跳转到引用位置；若有多处引用，在弹窗中可以选择想要查看的引用位置

- 代码格式化：Option + Command + L

- 查看代码结构树：Command + 7

- 代码引用查找：右键 -> Find Usages

- 代码查找：按两次 Shift

- [Code Linter](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/ide-code-linter-0000001363071681) 代码检查：进行编程规范方面的检查，规则可以配置

- 查看多端设备预览效果：Previewer 窗口打开 Profile Manager 中的 Multi-profile preview 开关

- Inspector 双向预览：Previewer 窗口点击 TT 图标，在 Component Tree 界面修改 UI 时，代码和预览窗口都会同时响应变化

- 真机调试：在设备中打开“设置-通用”页面，然后开启“开发者模式”和“USB调试”开关，无线调试需要设备和电脑连接同一WLAN网络，然后打开“无线调试”开关，并获取设备 IP 地址和端口号，然后在电脑中执行“hdc tconn IP:PORT”命令连接设备

    - 提供 Hot Reload（热重载）能力，在 Run Configurations 选择带‘H’图标的 Moudle 后启动应用，修改代码后点击 ‘H’ 图标刷新页面

    - 在日志的“HiLog“窗口查看日志和截屏，在“FaultLog“窗口查看设备崩溃信息，应用在 Release 后，因代码混淆无法定位到源码时，可以打开菜单“Code -> Analyze Stack Trace”，将提取的异常堆栈信息粘贴并进行解析后再查看。

    - 通过 ArkUI Inspector 查看页面组件布局和属性信息，并支持点击后跳转到代码位置（Run -> Edit Configurations 勾选 Enable DebugLine）

    - 在 [Profiler](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/ide-insight-0000001497343832-V5) 工具窗口实时监测设备 CPU、GPU、内存等多个维度的数据，自顶向下逐层展开分析，并可借助 Profiler 跳转到代码位置，结合代码进行白盒分析，明确不合理的负载出现位置，帮助识别性能瓶颈，定界问题所在，提高解决问题的效率

- [HarmonyOS 应用/服务发布](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/ide-publish-app-0000001053223745-V5) [AppGallery Connect](https://developer.huawei.com/consumer/cn/service/josp/agc/index.html) 是华为应用市场推出的应用一站式服务平台，致力于为开发者提供应用创意、开发、分发、运营、分析全生命周期服务，构建全场景智慧化的应用生态，更多介绍可查看[文档](https://developer.huawei.com/consumer/cn/doc/app/agc-help-overview-0000001100246618)，也需要关注下华为的应用市场[审核政策](https://developer.huawei.com/consumer/cn/doc/app/50104-overview)。
  
    - 注册华为开发者账号并实名认证
  
    - 可添加团队成员账号并分配权限（可选）
  
    - 创建项目和应用，并选择要使用的服务，如华为账号登录、应用内支付、认证服务等
  
    - 开发应用，配置签名证书指纹
  
    - 测试应用，可做开放式测试、云测试（付费）、A/B测试等
  
    - 发布应用，在配置好应用基本信息后，上传 APP 包，然后提交并审核，可以在“互动中心”处理审核问题
  
    - 升级应用时先向一定比例用户发布新版本，然后逐步提升用户比例，最终实现全网发布（也可仅更新应用信息）
  
    - 维护应用，如催促审核、下架应用、回退版本、删除应用、应用转移等
  
    - 分析报表以查看应用的使用和下载情况，如下载安装、应用内付费、崩溃和ANR分析等
  
    - 运营应用，可与用户评论互动，还有社区管理等功能，还可以申请将应用展示在华为商店提供的各种栏目介绍版块中，让用户更容易发现应用

## 测试

### 单元测试

单元测试框架（JsUnit）提供单元测试用例执行能力，提供用例编写基础接口，生成对应报告，用于测试系统或应用接口。

### UI测试

UI测试框架（UiTest）通过简洁易用的 API 提供查找和操作界面控件能力，支持用户开发基于界面操作的自动化测试脚本，而其脚本的运行基础仍是单元测试框架。

### 专项测试

鸿蒙提供了命令行测试工具 SmartPerf 和 wukong，SmartPerf 可以检测性能、功耗相关指标，包括FPS、CPU、GPU、RAM、Temp 等，wukong 支持 Ability 的随机事件注入、控件注入、异常捕获、报告生成等，通过模拟用户行为，对系统或应用进行稳定性压力测试。

鸿蒙还提供了 DevEco Testing 图形化界面工作做稳定性测试、性能测试和回归测试，并生成报告。

## 最佳实践

### 架构

架构设计的目的是让应用更易于维护、扩展和测试，鸿蒙建议的架构设计和苹果，安卓都差不多，就是纵向分层和横向模块化，分层后注意不跨层引用，模块化注意静态库和动态库的选择使用，将应用划分为多功能模块后，通过 [Navigation 导航设计](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/application-navigation-design-0000001860194417-V5)，完成业务模块之间的解耦，实现不同业务模块之间的页面跳转交互。

### 性能

- 避免在自定义组件的生命周期内执行高耗时操作，否则将阻塞 UI 渲染，增加 UI 主线程负担

- 当应用中单个组件设置了大量属性且该组件在应用中被大量使用时，会对应用的整体性能产生影响，这时可以考虑采用 AttributeModifier 动态注册组件属性的方式优化

- 当无需使用自定义组件的复杂能力，如生命周期函数时，可以使用 @builder 方法代替自定义组件，提高页面加载和刷新 UI 页面的效率

- 布局中的节点嵌套过多也会造成性能消耗，例如 Row() { Row() { ... }}，可以通过使用 Grid 等容器组件等方式来避免出现多余的嵌套子集

- ForEach 适合内容长度确定的列表，它会一次性初始化和加载所有元素，有分页功能的列表使用 LazyForEach 实现，它会根据屏幕可视区能够容纳显示的组件数量按需加载数据，使用 @Reusable 来实现组件的复用和使用更高效的 @Builder 来构建列表项 Item 的子组件

- 冷启动优化：不在应用生命周期回调函数和首页加载时执行耗时操作，可以异步延时方式处理，启动页图标 startWindowIcon 分辨率建议不超过 256px*256px

- import 模块按需加载，考虑动态加载耗时的模块

- 图片加载场景，使用 Image 组件提供的异步加载特性（syncLoad(false) 默认 false）加载网络图片，本地图片建议同步加载，避免加载时出现闪烁

- 当要执行复杂动画并导致卡顿时，可以将组件标记为启用 renderGroup 状态来缓存动效，此后当需要重新绘制相同组件时，就会优先使用缓存

- 尽量让主线程只执行 UI 绘制相关的任务，而将非 UI 的耗时任务分配给其他线程或者延迟处理，利用 TaskPool 执行简单并行任务，利用 Worker 完成周期类耗时操作，使用 Worker 需要开发者关注线程数量的上限（最多创建8个），管理线程生命周期，随着任务的增多也会增加线程管理的复杂度，TaskPool 基于 Worker 做了更多场景化的功能封装，支持任务组、任务优先级、取消任务等能力，且可以根据任务数量进行自动的扩容与缩容，还可以根据任务优先级进行任务调度

- 按照组件颗粒度，状态一般分为组件内独享的状态和组件间需要共享的状态，在没有强烈的业务需求下，尽可能按照状态需要共享的最小范围选择[合适的装饰器](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/status-management-0000001788519533-V5)（@State），以避免非必要的 UI 视图刷新，优先级依次为 @State+@Prop、@State+@Link或@State+@Observed+@ObjectLink > @Provide+@Consume > LocalStorage > AppStorage

    - @State+@Prop：适合状态结构简单，且共享状态的组件间层级相差不大的场景。或功能上要求子组件不实时同步修改给父组件的场景

    - @State+@Link：适合状态结构复杂，且共享状态的组件间层级相差不大的场景。或功能上要求子组件对状态的修改实时同步给父组件的场景

    - @State+@Observed+@ObjectLink：适合需要观察嵌套类对象的子属性变化的场景或对象数组的数据项属性变化的场景，如监听列表卡片上某个属性的变化

    - @Provide+@Consume：适合用于对于整个组件树而言“全局”的状态，且该状态改动不频繁的状态共享场景，如共享界面的路由信息

    - LocalStorage：适合对于单个 Ability 而言“全局”的变量，主要用于不同页面间的状态共享场景

    - AppStorage：适合对于整个应用而言“全局”的变量或应用的主线程内多个 UIAbility 实例间的状态共享，如用户信息

### 功耗

省电模式和深色模式是手机功耗优化中常用的优化手段

### 安全

#### 应用隐私保护

- 使用隐私声明获取用户同意后才能获取用户数据

- 推荐使用安全控件 LocationButton 来获取位置信息，并优先选择使用模糊定位获取位置

- 可以用 Picker 来减少对用户存储数据的访问权限

- 申请敏感权限的时候要满足权限最小化的要求，只申请获取必需的信息或资源所需要的权限，减少权限滥用和敏感数据泄露问题

- 从技术上保证数据处理活动的安全性，包括个人数据的加密存储、安全传输等安全机制，优先在本地进行数据处理，而不是默认上传云服务，对未成年人数据更要注意保护

#### 应用数据安全

鸿蒙对设备和数据的安全等级都进行了划分，不同安全等级设备间的数据流转方式是不一样的，当本设备的数据安全标签不高于对端设备的设备安全等级时，数据才能从本设备同步到对端设备，否则不能同步，手机、平板的安全等级要比智能穿戴设备高。

数据使用应用沙箱作为保护机制，避免数据受到恶意路径穿越访问，在应用文件目录中，根据不同的文件加密类型，区分了不同的目录。

- el1，设备级加密区：设备开机后即可访问的数据区

- el2，用户级加密区：设备开机后，需要至少一次解锁对应用户的锁屏界面（密码、指纹、人脸等方式或无密码状态）后，才能够访问的加密数据区

应用如无特殊需要，应将数据存放在el2加密目录下，以尽可能保证数据安全。但是对于某些场景，一些应用文件需要在用户解锁前就可被访问，例如时钟、闹铃、壁纸等，此时应用需要将这些文件存放到设备级加密区（el1）。

#### 应用安全编码实现

- 不对外交互的应用组件 Ability 应该明确设置 exported 属性值为 false，以防受到其他应用程序调用并获取用户数据，或未经用户确认就进行拍照、打电话等操作

```
// module.json5 
"abilities": [ 
  { 
    "name": "PrivacyAbility", 
    "srcEntry": "./ets/privacyability/PrivacyAbility.ts", 
    "description": "$string:PrivacyAbility_desc", 
    "exported": false 
  } 
]
```

- 隐式启动应用组件时尽量避免携带个人数据，避免恶意应用通过声明同名 action 后诱导用户进入恶意应用，劫持携带的个人数据，如果要携带个人数据，需要显式指定目标应用组件（bundle名、ability名）或者将个人数据匿名化

```
let wantInfo:Want = {
  action: "ability.want.test", 
  bundleName:'com.example.myapplication10', 
  abilityName:'MainAbility1', 
  parameters: { 
    "password": "xxxxxxxx" 
  } 
} 

this.context.startAbility(wantInfo) 
```

- 涉及账号密码输入的页面可以调用 window.setWindowPrivacyMode(true) 禁止截屏/录屏

- 不同应用程序间可以使用公共事件进行进程间通信，如果公共事件发送权限设置不当，且携带个人数据，任意应用就可以读取该数据，造成用户数据泄露。对于携带个人数据的公共事件，需要设置公共事件发送权限或者将个人数据加密

```
let options: commonEventManager.CommonEventPublishData = {
  code: 1,
  data: "ContactData", // 带敏感联系人数据发送
  subscriberPermissions: ["ohos.permission.READ_CONTACTS"], // 订阅者必须有这个权限，才能接收数据
}

commonEventManager.publish("MyCommonEvent", options, (err) => {
  ...
})
```

- Web 组件提供 onLoadIntercept 方法拦截不在白名单内的 URL，还提供了对 javascript 脚本方法的白名单校验

- 对 Ability 收到的 Want 进行合法性判断（判 null，判 undefined），避免出现应用业务逻辑被篡改，数据泄露、财产损失等问题，并在使用 Want 数据前进行 try...catch，防止应用崩溃

- 避免直接使用不可信数据来拼接 SQL 语句，防止 SQL 注入，应该使用参数化查询的方式或者对不可信内容做过滤

- 避免将个人数据存放到剪贴板中，因为任意程序都可以访问剪贴板中的内容

- app.json5 文件中的"debug"在发布时应设置成“false”，防止攻击者对应用进行更深入的分析调试

- 发布的软件包要进行代码混淆，增加攻击者分析代码成本（-enable-property-obfuscation: obfuscate the property names）

### 应用切面编程设计

HarmonyOS 主要通过插桩机制来实现切面编程，提供了 Aspect 类，包括 addBefore、addAfter 和 replace 接口