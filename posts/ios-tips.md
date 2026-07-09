---
title: "iOS 开发 Tips"
date: 2016-06-09 10:58:59 +0800
draft: false
---

用模拟器调试动画功能时，让动画执行的慢一些

```
模拟器菜单：Debug -> Show Animations
```

取两位整数，不够补 0

```
NSLog(@"%@", [NSString stringWithFormat:@"%02d月", 3]);
```

解码 cms 加密后的授权文件

```
终端：security cms -D -i example.mobileprovision
```

查找代码中的中文字符串，做国际化适配时会用到

```
Xcode左侧导航处：Find -> Regular Expression，然后输入 @"[^"]*[\u4E00-\u9FA5]+[^"\n]*?"
```

忽略第三方 SDK 文档中的警告

```
build settings ->  Other Warning Flags -> -Wno-documentation
```

自定义 leftBarButtonItem 后，左滑返回手势失效

```
self.navigationController.interactivePopGestureRecognizer.delegate = self;
```

在 xib 中给 UILabel 或 UITextView 设置多行文字

```
输入文字后，用 control + enter 来插入换行符，相当于在代码中添加 \n
```

禁用 UIButton 并且颜色不变灰

```
button.userInteractionEnabled = NO;
```

修改约束后，用动画展示效果

```
[UIView animateWithDuration:0.3f animations:^{
    [myView layoutIfNeeded];
}];
```

快速定位视图约束警告

```
po [[UIWindow keyWindow] _autolayoutTrace]
```

给 UIView 设置透明度后不影响 subviews

```
superView.backgroundColor = [[UIColor blackColor] colorWithAlphaComponent:0.5];
```

隐藏 Grouped TableView 上边多余的间隔

```
self.tableView.tableHeaderView = [[UIView alloc] initWithFrame:CGRectMake(0, 0, 0, CGFLOAT_MIN)];
```

编译出 error 后继续编译

```
Xcode -> preference -> general -> 勾选 Continue building after errors
```

自定义类后，禁止通过 init 方法初始化对象

```
- (instancetype)init UNAVAILABLE_ATTRIBUTE;
或
- (instancetype)init __attribute__((unavailable("init 方法不可用，请用 initWithName:")));
```

忽略可以忽略的警告，[更多警告](http://fuckingclangwarnings.com)

```
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"

#pragma clang diagnostic pop
```

