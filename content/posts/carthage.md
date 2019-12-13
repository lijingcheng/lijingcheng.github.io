---
title: "使用 Carthage 做依赖管理"
date: 2016-12-23 19:18:47 +0800
draft: false
---

[Carthage](https://github.com/Carthage/Carthage) 会在帮你下载完第三方依赖库后，通过 xcodebuild 将其编译成动态库，但它不会像 CocoaPods 那样去修改你的项目文件和编译设置，这些都需要你自己去完成。

# Carthage VS CocoaPods
- CocoaPods 需要我们在本地维护第三方库依赖的 podspec 文件，大部分 pod 命令执行时都会去读取此文件，Carthage 则是去中心化的管理方式，不需要维护这种说明文件，它会去直接下载项目并编译成动态库使用，所以对使用 Carthage 的项目来说，最低系统适配要求 iOS8+
- CocoaPods 在执行 pod install 后会帮我们做好所有配置工作，我们只需要用它提供的 workspace 文件打开项目即可，使用 Carthage 的话需要我们自己到项目中进行动态库以及打包资源的配置，但是好处是项目配置信息相对 CocoaPods 来说较干净
- Carthage 使用的是动态库方式，所以无法进行调试，看不到源码，但带来的好处是编译速度的提高
- Carthage 的下载源目前仅支持 GitHub（GitHub.com 和 GitHub Enterprise），CocoaPods 除了 GitHub，还支持我们托管在公司的 Git 仓库，还有本地路径
- 目前支持 CocoaPods 的第三方库比 Carthage 要多一些

我们可以在一个项目里同时使用 CocoaPods 和 Carthage，可以用 Carthage 管理比较成熟并且不需要调试的第三方库，用来提高编译速度，再用 CocoaPods 管理其它有可能需要进行代码调试的第三方库，还可以用来在组件化开发中做依赖设置。

# 安装 Carthage
建议通过 HomeBrew 安装

```
brew install carthage
```

# 使用 Carthage
在项目目录下创建 [Cartfile](https://github.com/Carthage/Carthage/blob/master/Documentation/Artifacts.md) 文件，并写入想要使用的第三方库

```
github "lijingcheng/FMDBHelper" == 1.0.0
```

* 获取/更新 第三方库

```
carthage update --platform iOS
```

执行完成后，本地目录下会新增以下文件及目录

- Cartfile.resolved 作用同 CocoaPods 中的 Podfile.lock 文件，用来跟踪项目当前使用的第三方库版本，此文件需要提交到 Git
- Carthage/Checkouts 第三方库的项目代码会存放在这里
- Carthage/Build 用于存储根据第三方库的项目代码打包后的动态库以及 .dSYM 文件

将动态库添加到项目中

```
Target -> General -> Embedded Binaries
```

将资源文件添加到项目中

```
Target -> Build Phases -> Copy Bundle Resources
```

针对由 universal binaries 引起的 App Store submission bug，还需要添加角本 `copy-frameworks`

为了根踪第三方库的 Crash 信息，还需要将 .dSYM 文件添加到 `Copy Files Phase`

导入第三方库 

```
#import <FMDBHelper/FMDBHelper.h>
```

完成了上述步骤并提交后，其他开发人员只需要用 carthage boostrap 来将第三方库下载到本地就可以了，以后还可以通过 carthage outdated 来检查依赖的第三方库是否有更新。

# carthage boostrap VS carthage update
- carthage update 会去读 Cartfile 文件，如果添加了新的第三方库，或更新了版本号，则需要用这个命令去下载更新，执行完成后 Cartfile.resolved 文件也会同步更新
- carthage boostrap 会去读 Cartfile.resolved 文件，并根据指定版本号进行下载，所以如果只是为了下载则可以使用这个命令

# 让自己的开源项目支持 Carthage
Carthage 仅支持动态库，所以你的开源项目也只能支持 iOS8 及以上版本

- Carthage 提供给用户的动态库是根据项目中的 `动态库 Target` 编译打包后生成的，所以首先我们需要新建一个 Target，选择 Cocoa Touch Framework（动态库），并设置 Deployment Target
- 添加 .h 文件到 Build Phases -> Headers -> Public
- 添加 .m 文件到 Build Phases -> Compile Sources
- 添加其它资源文件到 Build Phases -> Copy Bundle Sources
- Carthage 只构建从 .xcodeproj 分享出来的 scheme，所以需要我们在 Manage Schemes 中将新生成的 scheme 设置为 shared
- 通过 `carthage build --no-skip-current` 来检测 scheme 是否能够构建成功，然后检查 Carthage/Build 目录
- Carthage 通过搜索 Git tag 来决定用户可以下载哪个版本的项目资源，所以还需要在提交代码后添加 tag 并 push 到 GitHub，格式建议写成 1.2.0 或 v1.2
- 通过在 Readme.md 中添加下面内容，用来在 github 上项目介绍中显示 ![Carthage compatible](https://img.shields.io/badge/Carthage-compatible-4BC51D.svg?style=flat)

```
[![Carthage compatible](https://img.shields.io/badge/Carthage-compatible-4BC51D.svg?style=flat)]()
```