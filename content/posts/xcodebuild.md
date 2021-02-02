---
title: "使用 xcodebuild 打包 IPA 并上传蒲公英和 TestFlight"
date: 2016-12-05 18:49:45 +0800
draft: false
---

[xcodebuild]() 是苹果提供的项目自动构建工具，包含在 Command Line Tools 中，可以完成 iOS 项目的编译、打包和签名等工作。  

[shell script]() 是一种命令语言，有点像 Windows 下的批处理，但更强大，它可以跑在 Linux/Unix 系统的 shell 程序中。

## 为什么要用 xcodebuild
通过 Xcode 对项目进行编译打包，并将 IPA 分发给测试人员这一过程操作步骤多并繁琐，而在 shell 脚本中使用 xcodebuild 命令执行这一过程便会非常方便快捷，特别是当项目进入测试阶段，每天都会打一个或多个测试包时，使用脚本进行自动化打包能够大大提高我们的工作效率。

## 以前的作法
AFNetworking 的作者 mattt 曾经提供了一个名为 [shenzhen](https://github.com/nomad/shenzhen) 的打包服务，使用起来非常简单方便，并且能够在打包后上传到很多分发平台上，可惜已经有两年多没有再维护了。

## 造个轮子
因为打包脚本写起来比较简单，并且它也会随着 Xcode 的发展而改变，所以在这里我们还是选择自己写一个脚本使用并维护，下面的介绍不会太详细，如果有更多需求可以使用以下命令来查看帮助，并修改脚本。

```
xcodebuild --help
```

完成打包并分发这一过程通常分为四个步骤： "build 工程 -> 生成 xcarchive 文件 -> 生成 ipa 文件 -> 上传到分发平台"

## 完整脚本
新建 xxx.sh 文件，然后将下面脚本复制过去，如果你也在用 CocoaPods，并且只需要打 Release 包，那么只需要用蒲公英提供给你的 userKey 和 apiKey 替换掉脚本里的就可以了。

```shell
#!/bin/sh

##########################################################################
######  1.执行 chmod +x ./xxx.sh 使脚本具有执行权限                      ######
######  2.通过 ./xxx.sh 执行脚本                                       ######
######  3.Xcode 需要提前配置好证书                                      ######
######  4.如果使用到 UMeng、JPush 等第三方库，可能还需要设置 bitcode = NO  ######  
##########################################################################


workspace_name=`find . -name *.xcworkspace | awk -F "[/.]" '{print $(NF-1)}'`
scheme_name=${workspace_name}
build_folder=$(PWD)/build/release-iphoneos
file_name=${build_folder}/${scheme_name}$(date +%Y%m%d%H%M)

start_time=`date +%s`

echo "================= 清理 ================="

xcodebuild clean -workspace ${workspace_name}.xcworkspace -scheme ${scheme_name} -configuration Release -sdk iphoneos SYMROOT=$(PWD)/build

if ! [ $? = 0 ]; then
    exit 1
fi

echo "================= 开始构建 ================="

xcodebuild archive -workspace ${workspace_name}.xcworkspace -scheme ${scheme_name} -configuration Release -archivePath ${file_name}.xcarchive

if ! [ -d "${file_name}.xcarchive" ]; then
    exit 1
fi

echo "================= 导出ipa ================="

xcodebuild -exportArchive -archivePath ${file_name}.xcarchive -exportPath ${build_folder} -exportOptionsPlist $(PWD)/ExportOptions.plist

if [ -e "${build_folder}/${scheme_name}.ipa" ]; then
    mv "${build_folder}/${scheme_name}.ipa" "${file_name}.ipa"
else
    exit 1
fi

echo "================= 上传dSYM ================="

bugly_id=""
bugly_key=""
dsym_file_path="${file_name}.xcarchive/dSYMs/${scheme_name}.app.dSYM"
app_version=$(sed -n '/MARKETING_VERSION/{s/MARKETING_VERSION = //;s/;//;s/^[[:space:]]*//;p;q;}' ${scheme_name}.xcodeproj/project.pbxproj)
bundle_id=$(sed -n '/PRODUCT_BUNDLE_IDENTIFIER/{s/PRODUCT_BUNDLE_IDENTIFIER = //;s/;//;s/^[[:space:]]*//;p;q;}' ${scheme_name}.xcodeproj/project.pbxproj)

curl -k --verbose "https://api.bugly.qq.com/openapi/file/upload/symbol?app_key=${bugly_key}&app_id=${bugly_id}" --form "api_version=1" --form "app_id=${bugly_id}" --form "app_key=${bugly_key}" --form "symbolType=2" --form "bundleId=${bundle_id}" --form "productVersion=${app_version}($(date +%H%M))" --form "fileName=${scheme_name}.app.dSYM" --form "file=@${dsym_file_path}"

echo "================= 上传到 TestFlight ================="

apple_api_ey=""
apple_api_issuer=""
xcrun altool --upload-app -f "${file_name}.ipa" -t ios --apiKey "${apple_api_ey}" --apiIssuer "${apple_api_issuer}" --verbose

echo "\n\n================= 耗时: $[ `date +%s` - start_time ] 秒 ================="
```

如果是上传到蒲公英可以用下面角本替换上传 TestFlight 那段角本

```shell
echo "================= 上传到蒲公英 ================="
pgy_user_key=""
pgy_api_key=""
curl -F "file=@${Build_File_Name}.ipa" -F "uKey=${pgy_user_key}" -F "_api_key=${pgy_api_key}" https://www.pgyer.com/apiv1/app/upload
```

在导出 ipa 文件时，需要我们提供一个 plist 文件，用于配置打包过程中所需要的参数，文件名为 ExportOptions.plist，并放在项目根目录下，内容用下面提供的就可以，如果不满足需要，可通过 xcodebuild --help 查看帮助。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>destination</key>
    <string>export</string>
    <key>method</key>
    <string>app-store</string>
    <key>provisioningProfiles</key>
    <dict>
        <key>${bundleId}</key>
        <string>${profileName}</string>
    </dict>
    <key>signingCertificate</key>
    <string>Apple Distribution</string>
    <key>signingStyle</key>
    <string>manual</string>
    <key>stripSwiftSymbols</key>
    <true/>
    <key>teamID</key>
    <string>${teamID}</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
</dict>
</plist>
```


