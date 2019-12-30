---
title: "使用 CocoaPods 做依赖管理"
date: 2015-02-11 15:10:58 +0800
draft: false
---

[CocoaPods](http://www.cocoapods.org) 可以为 iOS 项目使用的第三方类库和我们自己的私有类库提供依赖管理，我们只需要告诉它要使用的类库名称和版本号，然后再执行一条命令，它就会自动将这个类库的源码下载到本地，并且为工程设置好相应的系统依赖和编译项。

# 准备工作
由于 CocoaPods 是用 ruby 写的，所以需要有 ruby 环境和 git 环境，尽量使用 rvm 来管理 ruby，可避免因权限导致的 gem install 失败问题。

```
sudo gem update –system
``` 

为了提高下载速度，还需要将 ruby 源更改为国内地址

```
gem sources -a https://gems.ruby-china.com/ -r https://rubygems.org/
gem sources -l
``` 

# 安装并使用 CocoaPods
安装 CocoaPods

```
sudo gem install cocoapods (更新也用这个)
```

下载 CocoaPods 维护的所有 podspec 文件到"~/.cocoapods/repos/master/Specs"，podspec 文件主要用来描述依赖库的名称、版本、作者、下载地址等信息。通过 CocoaPods 下载第三方类库，其实就是根据我们指定的类库名称找到相关的 podspec，然后再根据 podspec 文件中指定的地址去下载。

```
pod setup
```

查看 CocoaPods 管理的依赖库信息 

```
pod search 依赖库的名字
```

新建 Podfile 文件，此文件用于配置项目所需要使用的依赖库

```
cd "项目根目录"
pod init
```

打开 Podfile 文件，按下面内容配置依赖关系，Podfile 的更详细配置方法可参照[官方文档](http://guides.cocoapods.org/syntax/podfile.html)

```ruby
source 'https://github.com/CocoaPods/Specs.git'

platform :ios, '7.0'
inhibit_all_warnings!

target 'xxx' do
  pod 'AFNetworking', '2.5.1' 
end
```

上面内容的意思是，specs 文件由 CocoaPods 提供，项目需要使用支持 ios7.0 及以上的依赖库，并且为指定 target 配置了 2.5.1 版本的 AFNetworking，并忽略依赖库中的所有警告。依赖库的版本号建议明确指定，这样可以避免更新依赖库后对现有工程造成影响，而且可以保证团队所有开发人员使用的版本一致。  

根据 Podfile 文件内容下载安装依赖库

```
pod install
```

执行完成后 CocoaPods 会自动为项目工程设置好相应的系统依赖和编译参数，当依赖库安装完成后，打开项目根目录，会发现多了以下文件及文件夹

- ".xcworkspace"，以后必须通过此 workspace 打开项目。  
- "Pods"，CocoaPods 将 Profile 中配置的所有依赖库都下载到这里，并且将所有依赖库打包成单独的静态库供主项目使用。
- "Podfile.lock"，用于保存已经安装的依赖库版本信息。如果在配置依赖库时没有明确指定版本，那么必须将此文件加入到版本控制中，否则有可能造成团队开发中不同成员使用的依赖库版本不一致。

查看所下载的依赖库是否有新版本

```
pod outdated
```

更新本地 podspec 仓库并更新依赖库

```
pod update
```

更新依赖库且不更新本地 podspec 仓库（速度会快很多）

```
pod update --no-repo-update
```

将 CocoaPods 从项目中移除，并还原其对 Xcode 的配置修改（1.0 版本开始支持，以前需要用第三方提供的方式）

```
pod deintegrate
```

# 让自己的开源项目支持 CocoaPods
通过 CocoaPods 创建项目会让整个事情变的简单一些

```
pod lib create FMDBHelper
```

创建完成后项目根目录会包含以下文件及文件夹
- ".travis.yml"，通过 travis-ci 做持续集成要用到的配置文件，一般情况下使用默认配置就可以，如果需要使用持续集成服务，还需要以 GitHub 帐号登录 [travis-ci](https://travis-ci.org)，并打开对应项目开关。
- ".gitignore"，建议将 Pods 目录也加入到忽略范围  
- "LICENSE"，默认为 MIT 
- "FMDBHelper.podspec"，通过 Cocoapods 下载项目时要用到的项目配置文件。  
- "README.md"，通过 markdown 语法编写此文件，用于在 GitHub 上显示项目介绍。  
- "Pod"，将自己的开源代码和资源文件放到这里 
- "Example"，demo 工程，包含测试用的 target。  

在 demo 工程中开发并测试
- 将源代码和资源文件分别放到 Pod/Classes 和 Pod/Assets 目录下
- 用 pod install 命令为 demo 工程安装依赖库，以后只要新增依赖库的代码或资源文件都需要更新
- 开发测试完成后还需要修改 podspec 文件

在将 podspec 发布到 CocoaPods 的 Git 库之前首先向 CocoaPods 注册你的信息，需要输入邮箱(与 podspec 中写的一致)和名字，稍后还需要验证 email

```
pod trunk register bj_lijingcheng@163.com "lijingcheng"
```

登录 GitHub，release 一版项目并打上标签，标签要与 podspec 中定义的一致，检查并发布 spec 文件，以后需要升级版本时也是用这个命令

```
pod trunk push FMDBHelper.podspec
```

更新本地 spec

```
pod repo update
```

# 通过 CocoaPods 维护私有库
可以按[官方指导](https://guides.cocoapods.org/making/private-cocoapods.html)来做，大致步骤与在 GitHub 上维护开源项目相似，区别如下：

- 需要通过 Git 建立自己的 spec 仓库，并在 Podfile 文件中填加 source

- 通过 pod repo 来查看现有的 spec 仓库

- 通过 pod repo add repo_name source_url 在 ~/.cocoapods/repos/ 目录下新建自己的 spec 仓库

- 通过 pod repo push --allow-warnings repo_name spec_name.podspec 命令将已经写好的 podspec 文件填加到 spec 仓库中

- 私有库新增版本后需要打 tag 并修改 podspec 文件中的 version，然后再次更新 spec 仓库

- 在 Podfile 中可直接通过 pod repo_name 安装私有库


