---
title: "将博客从 Octopress 迁移到 Hugo"
date: 2019-12-11T16:28:43+08:00
draft: false
---

# 迁移原因
Octopress 自 2015 年开始就没再更新过，再加上我使用的模板在宽屏显示器上也体验不太好，所以打算更新下博客样式，于是在目前比较流行的静态博客生成工具 Hexo 和 Hugo 之间经过比较后选择了 Hugo，相对来说 Hugo 不仅适合搭建博客，也同样适合搭建网站，它基于 go 语言，在发布时速度比较快，并且依赖较少。

# 安装 Hugo
建议使用 Homebrew 安装 Hugo

```
brew install hugo
```

新建站点

```
hugo new site blog
```

新建站点后进入 blog 目录，查看生成的文件及主要目录

- archetypes 目录下会有个模板文件，新生成的文章会以此为模板
- config.toml 网站配置文件
- content 用来存放 Markdown 文件
- layouts 存放 html 模板文件，如果使用了第三方模板，可以将 themes 里 layouts 目录下的 html 复制过来，然后在这里修改，hugo 会优先使用这个目录下的该文件，以后再更新 themes 下的模板文件时也不用担心文件冲突问题
- data 存储数据文件供模板使用
- public 生成的静态网站文件会放在这里
- static 可以把图片等静态资源放这里
- themes 存放网站主题文件

安装主题
[Hugo](https://themes.gohugo.io/) 整理了很多开发者制作的主题，安装时直接将主题下载到刚创建的 themes 目录中就可以了，具体方式可参考各主题的介绍说明

```
cd blog
git init
git submodule add https://github.com/vaga/hugo-theme-m10c.git themes/m10c
```

修改 config.toml

```
baseURL = "https://lijingcheng.github.io"
languageCode = "zh-cn"
title = "风行's Blog"
theme = "m10c"
paginate = 10

[params]
  author = "风行"
  avatar = "images/avatar.png"
  description = "一直在学习的大龄程序员"
  [[params.social]]
    name = "github"
    url = "https://github.com/lijingcheng"
  [[params.social]]
    name = "instagram"
    url = "https://www.instagram.com/bj_lijingcheng/"
```

新建文章

```
hugo new posts/first.md
```

本地预览

```
hugo server -D
```

通过 [http://localhost:1313](http://localhost:1313) 查看

将要发布的文章内的 draft 改为 false 后就可以生成静态页面了

```
hugo
```

使用 GitHub Actions 将生成的静态页面发布到 Github Pages，GitHub Actions 是 GitHub 推出的持续集成服务，使用起来非常简单，首先在 GitHub 网站中打开项目首页，然后在 Actions 中设置 ACCESS_TOKEN，然后再把写好的角本放到仓库根目录下的 .github/workflow/deploy.yml 文件中就可以了，甚至连角本都可以直接使用别人写好的。 

```
name: github pages

# 当 master 分支发生 push 事件时执行下面任务
on:
  push:
    branches:
      - master

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v1

    - name: Setup Hugo
      uses: peaceiris/actions-hugo@v2.3.1
      with:
        hugo-version: '0.61.0' 

    - name: Build
      run: hugo --minify

    - name: Deploy
      uses: peaceiris/actions-gh-pages@v2.5.1
      env:
        ACTIONS_DEPLOY_KEY: ${{ secrets.ACCESS_TOKEN }}
        PUBLISH_BRANCH: gh-pages
        PUBLISH_DIR: ./public
```
