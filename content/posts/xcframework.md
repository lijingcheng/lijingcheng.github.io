---
title: "开发 Swift XCFramework 静态库"
date: 2024-06-07 09:49:45 +0800
draft: false
---

本文不讨论静态库和动态库区别，只记录使用 Xcode15 创建开发 XCFramework 静态库及使用方式

- 新建 Framework 工程，为了方便测试，需要勾选 “Include Tests”

- 打开 Edit Scheme，将 Run 下面的 Build Configuration 设置为 Release  

- 选中 Target 点击 General，修改 Minimum Deployments

- 选中 Target 点击 Build Settings，Mach-O Type 选择 Static Library

静态库需要暴露给别的项目使用的类和方法使用 public 修饰，需要被继承重写的类用 open 修饰，如果有图片等资源文件，可以存放在 Bundle 中，通过下面代码来引用

```swift
if let url = Bundle(for: Self.self).url(forResource: "BundleName", withExtension: "bundle"), let bundle = Bundle(url: url) {
    if let path = bundle.path(forResource: "fileName", ofType: "txt") {
        ...
    }
}
```

静态库项目设置好，并且代码也开发完成后，就可以生成 XCFramework 文件了，新建用于打包的 Target，在 Other 栏里选择 Aggregate，并做下面设置

- Edit Scheme，将 Build Configuration 设置为 Release

- Build Settings 中的 User Script Sandboxing 选择 NO，Build Libraries for Distribution 选择 YES

- Build Phases 新建 Run Script，并添加用于制作 Universal XCFramework 的脚本

```shell
SCHEME_NAME="${PROJECT_NAME}"
FRAMEWORK_NAME="${SCHEME_NAME}"
SIMULATOR_ARCHIVE_PATH="${BUILD_DIR}/${CONFIGURATION}/${FRAMEWORK_NAME}-iphonesimulator.xcarchive"
DEVICE_ARCHIVE_PATH="${BUILD_DIR}/${CONFIGURATION}/${FRAMEWORK_NAME}-iphoneos.xcarchive"
OUTPUT_DIC="./xcframework/"

# Simulator xcarchieve
xcodebuild archive \
  -scheme ${SCHEME_NAME} \
  -archivePath ${SIMULATOR_ARCHIVE_PATH} \
  -sdk iphonesimulator \
  SKIP_INSTALL=NO
  
# Device xcarchieve
xcodebuild archive \
  -scheme ${SCHEME_NAME} \
  -archivePath ${DEVICE_ARCHIVE_PATH} \
  -sdk iphoneos \
  SKIP_INSTALL=NO
  
# Clean up old output directory
rm -rf "${OUTPUT_DIC}"

# Create xcframwork combine of all frameworks
xcodebuild -create-xcframework \
  -framework ${SIMULATOR_ARCHIVE_PATH}/Products/Library/Frameworks/${FRAMEWORK_NAME}.framework \
  -framework ${DEVICE_ARCHIVE_PATH}/Products/Library/Frameworks/${FRAMEWORK_NAME}.framework \
  -output ${OUTPUT_DIC}/${FRAMEWORK_NAME}.xcframework
```

XCFramework 文件可以放到私有库中，并以 CocoaPods 方式集成到项目中进行联调，podspec 文件如下

```ruby
Pod::Spec.new do |s|
s.name         = 'XXX'
s.version      = '1.0.0'
s.author       = '...'
s.license      = 'MIT'
s.homepage     = '...'
s.source       = { :git =>'...', :branch => 'master', :tag => s.version}
s.summary      = '...'
s.platform     = :ios, "12.0"
s.resource     = 'XX.bundle'
s.vendored_frameworks = "XX.xcframework"
s.pod_target_xcconfig = {
  'DEFINES_MODULE' => 'YES',
  'CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES' => 'YES'
}
end
```

可以在联调结束后再确定版本号，联调期间不修改版本号的话，项目在 pod install 前需要清除缓存

```ruby
pod cache clean XCFrameworkName --all
rm -rf Pods/XCFrameworkName
```