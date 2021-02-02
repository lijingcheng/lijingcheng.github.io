---
title: "iOS 组件化开发"
date: 2018-04-30T19:11:27+08:00
draft: false
---

随着 app 功能和体积的增长，也带来了如编译速度变慢、提交代码经常出现冲突、以及业务代码混在一起，开发功能类似的新项目时需要从头搭建等问题，于是很多团队都选择了利用组件化开发来解决这些问题，下面介绍下在组件化开发过程中需要注意哪些地方。

# 拆分组件  
组件即功能组件，模块即业务模块，拆分时要把握好粒度，要考虑到维护成本
  
- 每个组件对应一个 project，身为组件的同时还能够独立运行和打测试包

- 大点的项目除了按框架分层拆分还可以按业务模块拆分，需要把握好拆分粒度

- 小项目按框架分层拆分就可以了

# 组件之间的依赖关系  
- 业务模块依赖于框架

- 业务模块之间避免横向依赖（可适当的有些重复代码或存放重复资源）

- 禁止框架依赖业务模块

# 组件化实施  
通过 CocoaPods 来实现组件化

- Podfile：定义私有库地址和需要依赖的组件及版本

- Podspec：定义组件的依赖库、编译设置、以及需要打包的资源及代码，资源包括 xib、国际化文件、assets 等

# 组件中的资源访问
访问 image、xib、storyboard 时需要指定 bundle，如果项目中使用了 R.swift，可以在各组件中通过以下角本来修改 R.generated.swift 中设置的 bundle，修改后在组件中使用 R.image.xxx()，此代码在组件中是指 main bundle，在主工程中会将其认定为 core bundle。

```shell
$PODS_ROOT/R.swift/rswift" generate "$SRCROOT" --accessLevel public
sed -i '' -e "s/Bundle(for: R.Class.self)/Bundle.core/g" “$SRCROOT/
```

还需要在各组件中正确使用 open、public、private

# 组件之间的路由跳转
网上有很多关于这方面的文章，我们使用的是一种较简单比较适合我们的方式：Router.open 跳转方法需要传入几个比较重要的参数：name、storyboard、bundle，如果要打开的 ViewController 是通过代码或 xib 实现的，需要在这里指定 name，然后会通过 viewControllerWithClassName 方法得到 VC 对象，如果 ViewController 是定义在 storyboard 里的，那么在跳转时需要指定 storyboard，如果要打开的是别的组件中的 ViewController，还需要指定对应 bundle。

通过上面方式实现组件间的路由跳转需要对 ViewController 和 params 有以下要求

- ViewController 的类名要与 xib 名或 storyboard 中的 id 相同，如果要支持被其他组件使用并且是通过 xib 画的 UI，还需要重写 init() 并调用 super.init(nibName: nil, bundle: Bundle.xxx) 设置 nibName 和 bundle

- 跳转页面传参通过 KVC 方式实现，所以要求 ViewController 的相关参数要加上 @objc，还需要加上注释说明属性用途

- ViewControllerName 和 propertyName 尽量不去变更，如有变更需要让别人知道

下面代码描述了 open 方法的定义和如何根据 ViewController 名字得到其对象

```swift
public static func open(_ name: String, storyboard: String = "", bundle: Bundle = Bundle.main, params: [String: Any] = [:], needLogin: Bool = false, animated: Bool = true, present: Bool = false, completion: (() -> Void)? = nil) {
    let viewController = RouterService.viewControllerWithClassName(name, storyboard: storyboard, bundle: bundle)
        
    RouterService.open(viewController, params: params, needLogin: needLogin, animated: animated, present: present, completion: completion)
}
    
public static func viewControllerWithClassName(_ name: String, storyboard: String = "", bundle: Bundle) -> UIViewController? {
        var viewController: UIViewController?
        
        if storyboard.isEmpty {
            var bundleName: String?
            
            if bundle == Bundle.main {
                bundleName = (Bundle.main.infoDictionary!["CFBundleExecutable"] as! String).replacingOccurrences(of: "-", with: "_")
            } else {
                bundleName = bundle.infoDictionary!["CFBundleName"] as? String
            }
            
            // Swift 语言开发的 VC 对象需要通过 bundle + name 的方式初始化
            if let vc = NSClassFromString((bundleName! + "." + name)) as? UIViewController.Type {
                viewController = vc.init()
            } else {
                // Objective-C 语言开发的 VC 对象在初始化时不需要加 bundle
                if let vc = NSClassFromString(name) as? UIViewController.Type {
                    viewController = vc.init()
                }
            }
        } else {
            viewController = UIStoryboard(name: storyboard, bundle: bundle).instantiateViewController(withIdentifier: name)
        }
        
        return viewController
    }
```

再介绍几个小功能和需要注意的地方

- 打开页面时指定是否需要登录，然后将原本想要跳转的页面信息及参数传递给登录页，当登录成功后直接跳转到该页面，并将登录页本身从导航堆栈中移除

- pop 页面时除 navigation 的三种方式外，增加锚点方式返回，例如在购买商品页面填加锚点，然后当页面流转到购买成功时，可将导航堆栈反转过来，pop 到最近的一个锚点页面或指定锚点页面

- 页面跳转如果设置了使用动画，在动画结束前不响应其它跳转任务

- pop 时要考虑到导航堆栈里不存在指定页面的场景，还要确定当前 VC 是否是 navigationController

- 传参使用字典还是 Model 也是需要注意的问题，虽然用字典代替 Model 存储数据对于组件化架构来说是解决组件之间数据传递参数的好办法，并且可以做到组件间的松耦合，但使用起来较麻烦，容易出错，所以建议简单的数据模型可以不定义成 Model，复杂模型还是有必要使用 Model，代码清楚，复用性好，有维护多组件能力的团队可以将多个业务组件共用的 Model 单独以组件形式维护，或者像我们一样允许组件中存在重复 Model

# 组件的多环境打包
App 运行环境通常有测试环境、预上线环境、正常环境三种，这里分别用 QA、STG、PRD 表示，有些公司还会有企业开发者账号，用来自己分发项目更方便的去做测试工作，下面针对这种情况做多环境打包设置

- 通过 xcconfig 方式在原先的 debug、release 上扩展出 staging、enterprisePRD、production，切换环境时只要在 Scheme 中的 Build Configration 中设置一下就可以了（对于 xcconfig 这里不做详细介绍）

- 上面列出的 debug 和 release 对应 QA，enterprisePRD 和 production 对应 PRD，其中 production 作为正式打包上线的设置项

- xcconfig 文件中可针对不同环境设置不同的 app 名字，还可以对 enterprisePRD 设置不同的微信Id 或其它内容
 
组件在不同环境中 podspec 的内容也会不同，主要体现在 version 和 source 字段

```ruby
# 开发环境
s.version      = '6.5.5'
s.source       = { :git =>'http://gitlab.mx.com/ios/wandafilm-card.git', :branch => "feature/#{s.version}"}
```

```ruby
# 上线环境，需要打 git tag
s.version      = '6.5.5.master'
s.source       = { :git =>'http://gitlab.mx.com/ios/wandafilm-core.git', :branch => 'master', :tag => s.version}
```

建议使用 Jenkins 或其他持续集成服务来完成打包发版工作，以减少不必要的重复操作，Jenkins 中的角本除了完成基础打包功能外还应完成以下功能

- 通过 PlistBuddy 来修改 Info.plist 中的 CFBundleShortVersionString 字段
- 测试包按渠道自动上传到蒲公英或别的分发平台，发版要用的包需要自动上传 TestFlight 并完成双重验证
- 发版时自动将 dSYM 文件上传至 Bugly

在组件化开发过程中也可以将部分操作角本化，例如各组件新版本分支的创建、新版本 podspec 的修改并上传到私有库、提测以及发版上线阶段的分支合并、对应 podspec 的修改以及打 tag 等，使用角本的好处不仅是可以减少重复操作，提高效率，还可以提高操作的准确性。


