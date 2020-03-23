---
title: "Code Review 注意事项"
date: 2020-01-13T10:00:38+08:00
draft: false
---

持续并有效的 Code Review 不仅可以提高代码质量，降低程序风险，还可以提高开发人员技术水平，但前提是需要开发人员能够真正认可并意识到这并不是在浪费时间，而且在实施前最好能够得到公司认可，并能够将 Code Review 时间计入工作量，下面列出几个需要注意的地方：

- 要有一个 CheckList，对一些代码问题进行定义，并要求开发人员以此为准

- 代码风格上的问题应该通过自动审查工具去做，如 [OCLint](https://github.com/oclint/oclint)/[SwiftLint](https://github.com/realm/SwiftLint)，代码逻辑及性能上的问题可通过 Merge Request 去做，整个团队一起互相 Review 的方式不适合频繁实行，应该以总结的性质定期来做

- 要在代码提交测试前做，避免测试人员返工，影响进度

- 审查过程中不要太关注代码细节，并且不要过度主观，例如同一功能可用多种方式实现并且它们之间没有明显好坏的情况下不用要求别人修改代码

- 审查要及时，打回时被审查者要尽量优先修改问题然后再次提交

- 审查不通过打回前，条件允许的话最好先跟代码提交者口头说明原因并达成一致，无法达成一致时可找 leader 解决

- 对于找谁审核代码这个问题，首先每份代码都要明确责任人，可以让同一套代码有两个人负责，这样不仅能够明确责任，还可以在其中一人休长假或有突发事件人不在的情况下，另一人能够有能力修改相关代码

- 要按功能提交代码，不要攒一堆然后一次提交，否则不仅会一次性大量占用审查者时间，而且会增加审查难度，还需要注意的是提交描述要根据修改内容写清楚，遵守 Git Commit 规范，这样可以促使团队形成一致的代码提交风格，在需要回溯提交历史时也方便查找
    - Angular 团队在开源框架 AngularJS 中的提交记录所遵守的[规范](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines)被业内很多人认可和使用，格式为：`type(scope):subject`
        - feat(首页):增加公告功能
        - fix(卡列表):默认图不正确
        - refactor:优化 WebView 遇到白屏时的处理
        - docs:为购卡功能添加注释
        - style:整理代码风格
        - chore:其它琐事...
    - 我们可以手动按规范来编写提交信息，也可以借助一些 js 库来帮我们遵守规范，首先我们需要安装 Node.js 环境下的包管理器 npm（Node.js 可以使 JavaScript 脱离浏览器的运行环境）
        - 使用 commitizen 来辅助我们编写符合 `type(scope):subject` 格式的提交信息
        - 使用 commitlint 对提交信息进行格式检查，并通过 husky 库更方便的通过 git hook 在 pre-commit 时强制要求每条提交记录都能够遵守规范
    - 当我们开始按规范编写提交信息后，便可以使用 conventional-changelog-cli 生成提交记录

下面列出的代码审查 CheckList 可供参考，其中一部分仅适用于 Swift 开发

- 代码简洁不重复

- 方法短小并专注一个功能

- 删除无用的代码及资源

- 适时地使用 private 实现封装并使代码更清晰

- 避免无意义的 log，保持好的编码习惯

- 不要用魔术数字

- 框架代码及复杂代码要写注释

- 遍历数组或字典时不允许添加或删除元素

- 代码尽量不要有警告

- 相似意义的常量超过 2 个时就要考虑用枚举代替

- 命名要做到“见名知意”，UI 控件的命名要能看出来是做什么的

- 方法内变量的声明尽量离使用它的地方近一些

- 对性能要求不高的界面建议使用 xib 或 storyboard 来画以降低代码量

- 尽量避免循环引用问题

- Model 中对应接口返回 Int 类型字段如果需要定义成枚举，需要注意接口返回未定义 case 的场景

- 避免对可选类型强解包，可用 `if let foo = foo { ... }` 或可选链 `foo?.doSomething()`

- 尽早的退出方法，可提升代码的可读性，例：`guard xx else { return }` 或 `if xxx { return} `，使用 guard 还能够有效减少 if-else 嵌套 

- 定义 model 用 struct，值类型是线程安全的，并以栈的形式分配，速度上比 class 快

- 用于对接接口返回数据的 model 中的属性必须是 optional 的，当接口返回字段较少时，可用字典

- 不要在 ViewModel 里用到跟 UIKit 相关的东西，Controller 当 View 用，尽量不写逻辑性代码

- UI 切的图需要[压缩](https://tinypng.com)后再使用，图片命名方式：
`icon_hud_loading@2x.png`

- 项目的主色和辅色有对应常量，如果在 xib 中使用，需要先将做好的 .clr 文件复制到指定目录

- 用 `// MARK:` 来做代码分段，用 `// TODO:` 来做待办，但需要写出计划完成时间或条件

- 尽量多用常量来增强代码的不可变性，可以让代码更加安全并提高可读性

- 尽量避免混合使用 Swift 类型和 NSObject 子类，这样会造成大量的类型转换，对性能有影响

代码审查如果要做就一定要做好，并坚持下去，半途而废的话之前的工作也就白做了，最后推荐 Ray Wenderlich 提供的 [Swift Style Guide](https://github.com/raywenderlich/swift-style-guide) 和《代码整洁之道》、《重构—改善既有代码的设计》这两本书。





