---
title: "在 Git 环境下维护多个 SSH Keys"
date: 2015-03-01 18:11:42 +0800
draft: false
---

[SSH Key]() 登录方式可以避免密码在网络中传输，也就保证了登录过程的安全，也不会因此受到中间人攻击，如果在 SSH 密钥登录基础上再加上密码短语 （passphrase）的使用，安全性便会再次提高。

作为一个程序猿，我们经常会往公司的 Git 服务器上提交代码，还有很多猿在 GitHub 上也有自己的开源项目，不管是公司的服务器还是 GitHub 服务器都会在你提交代码时通过维护在服务器上的公钥进行验证，如果你希望能够以不同身份向不同服务器提交代码，那么你需要在机器上维护多个 SSH Key，并且将不同的公钥添加到不同的服务器中。

下面介绍下在已经拥有一个用于公司服务器的 SSH Key 后，如何再添加一个用于 GitHub 的 SSH Key。

首先进入 .ssh 目录

```
cd ~/.ssh
```

创建用于 GitHub 的 SSH Key，根据提示将名字设置为 id_rsa_github

```
ssh-keygen -t rsa -C "注册 GitHub 时用的 Email"
```

因为 Git 默认只读取 id_rsa，为了让 SSH 识别新的私钥，需将 id_rsa_github 添加到 SSH Agent 中

```
ssh-add id_rsa_github
```

将 id_rsa_github.pub 中的公钥复制到 GitHub 帐户中，并为 GitHub 项目指定提交代码时使用哪个用户，简单的方式是打开 SourceTree 中的项目，然后在“设置 -> 高级”中直接修改用户名和邮箱，也可以打开 ~/.ssh 目录下的 config 文件，修改 [user] 部分，指明服务器及所使用的密钥

```
Host github.com
IdentityFile ~/.ssh/id_rsa_github

Host gitlab.xxx.com
IdentityFile ~/.ssh/id_rsa
```

如果 .ssh 目录下没有 config 文件，便新增一个

```
touch config
```

如果你使用 SourceTree 的话，也可以在添加 GitHub 帐户时直接生成密钥，它会帮你配置好一切并上传，最后再自己将私钥添加到 SSH Agent 中。

