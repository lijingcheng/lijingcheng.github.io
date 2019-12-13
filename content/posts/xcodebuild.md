---
title: "使用 xcodebuild 打包 IPA 并上传蒲公英"
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
######   1.执行 chmod +x ./xxx.sh 使脚本具有执行权限                    ######
######   2.通过 ./xxx.sh 执行脚本，./ 不能省略                          ######
######   3.Xcode 需要配置好证书，并且不能连接非测试机，否则会签名失败        ######
######   4.将 .xcarchive 中的 .dSYM 文件备份一下                       ######
######   5.在蒲公英网站的应用设置中添加成员后，便会在上传成功后给他发邮件     ######
##########################################################################

# CocoaPods 打包需要使用 workspace 名字
WorkSpace_Name=`find . -name *.xcworkspace | awk -F "[/.]" '{print $(NF-1)}'`

# 要打包的 scheme 名字，默认与 workspace 名字一样
Scheme_Name=${WorkSpace_Name}

# build 文件目录
Build_File_Path=$(PWD)/build/Release-iphoneos

# build 文件名字 (archive/ipa)
Build_File_Name=${Build_File_Path}/${Scheme_Name}$(date +%Y%m%d%H%M)

# 蒲公英
PGY_User_Key="由蒲公英提供"
PGY_API_Key="由蒲公英提供"

# 开始时间
Start_Time=`date +%s`

echo "================= 开始编译 ================="

xcodebuild clean -workspace ${WorkSpace_Name}.xcworkspace -scheme ${Scheme_Name} -configuration Release -sdk iphoneos SYMROOT=$(PWD)/build

if ! [ $? = 0 ]; then
    exit 1
fi

echo "================= 开始构建 ================="

xcodebuild archive -workspace ${WorkSpace_Name}.xcworkspace -scheme ${Scheme_Name} -archivePath ${Build_File_Name}.xcarchive

if ! [ -d "${Build_File_Name}.xcarchive" ]; then
    exit 1
fi

echo "================= 导出ipa ================="

xcodebuild -exportArchive -archivePath ${Build_File_Name}.xcarchive -exportPath ${Build_File_Path} -exportOptionsPlist $(PWD)/exportOptions.plist

if [ -e "${Build_File_Path}/${Scheme_Name}.ipa" ]; then
    mv "${Build_File_Path}/${Scheme_Name}.ipa" "${Build_File_Name}.ipa"
else
    exit 1
fi

echo "================= 上传到蒲公英 ================="

curl -F "file=@${Build_File_Name}.ipa" -F "uKey=${PGY_User_Key}" -F "_api_key=${PGY_API_Key}" https://www.pgyer.com/apiv1/app/upload

# 结束时间
End_Time=`date +%s`

echo "\n\n================= 耗时: $[ End_Time - Start_Time ] 秒 ================="
```

在导出 ipa 文件时，需要我们提供一个 plist 文件，用于配置打包过程中所需要的参数，文件名为 exportOptions.plist，并放在项目根目录下，内容用下面提供的就可以，如果不满足需要，可通过 xcodebuild --help 查看帮助。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>provisioningProfiles</key>
	<dict>
		<key>com.bundleid</key>
		<string>profile文件名</string>
	</dict>
	<key>teamID</key>
	<string>your teamId</string>
	<key>method</key>
	<string>development</string>
</dict>
</plist>
```


