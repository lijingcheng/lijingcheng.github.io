---
title: "GitHub Pages + Octopress 搭博客"
date: 2015-01-04 14:51:02 +0800
draft: false
---

[Github Pages](https://pages.github.com) 可用来搭建静态网站，它提供了免费域名、空间、无限流量，并且在世界各地都有较好的访问速度。不过网站也会轻易被人 clone，如果在意的话可以使用私有库。

[Octopress](http://octopress.org) 是开源的静态博客系统，可用来为静态网站提供所需的 HTML。

# 准备工作
在 GitHub 上新建名为 yourname.github.io 的版本库，之后可通过 yourname.github.io 域名来访问博客，还需要有 git 和 ruby 环境，尽量使用 rvm 管理 ruby，可避免因权限导致的 gem install 失败问题，记得要设置某个版本为当前使用版本，最后还需要更改 ruby 源，可提高下载速度

```
gem sources -a https://gems.ruby-china.com/ -r https://rubygems.org/
gem sources -l
``` 

# Octopress 环境搭建
安装 Octopress

```
git clone git://github.com/imathis/octopress.git octopress
```

安装所需依赖  

```
cd octopress
sudo gem install bundler
bundle install
```

安装默认模板

```
rake install
```

关联 GitHub Pages

```
rake setup_github_pages
git@github.com:yourname/yourname.github.io.git
```

配置 [Octopress](http://octopress.org/docs/configuring) 时建议删除 HTML 和 CSS 中用不到的东西，可提高访问速度

# 写博客并发布
新建文章（博客存储为 markdown 文件，位于 \octopress\source\\_posts 目录下）

```
rake new_post["new_blog_title"]
```

生成静态网站

```
rake generate
```

通过 http://localhost:4000 预览静态网站，之后修改 markdown 后直接刷新即可

```
rake preview
```

部署并将 Octopress 生成的 HTML 等文件提交到 master 分支

```
rake deploy
```

将 Octopress 修改过的 markdown 等资源文件提交到 source 分支

```
git add .
git commit -m 'your commit message'
git push origin source
```

如果希望多台电脑能够一起使用 Octopress，首先下载 source 分支到你的电脑上，然后再下载 master 分支到博客根目录下的 _deploy 文件夹，然后就可以正常使用了。