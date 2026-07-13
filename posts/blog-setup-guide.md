---
title: 从 Hugo 迁移到 VitePress
date: 2026-07-13
recommend: false
---

博客基于 [VitePress](https://vitepress.dev/) 构建，**目录结构概览：**

```
blog/
├── .github/workflows/deploy.yml    # CI/CD 自动部署
├── .vitepress/
│   ├── config.mts                  # 站点配置
│   ├── posts.data.mts              # 文章数据 loader
│   └── theme/
│       ├── index.js                # 主题入口
│       ├── Layout.vue              # 自定义布局
│       ├── PostList.vue            # 文章列表组件
│       └── ImageGallery.vue        # 图片画廊组件
├── index.md                        # 首页
├── posts/                          # 文章目录 (markdown)
├── public/images/                  # 图片资源
└── scripts/gen-image-manifest.mjs  # 图片清单生成脚本
```

## 克隆项目

```bash
git clone git@github.com:lijingcheng/blog.git
cd blog
```

## 安装依赖

```bash
npm install
```

## 本地预览

```bash
npm run dev
```

这个命令会先运行 `scripts/gen-image-manifest.mjs` 扫描图片目录生成清单，然后启动 VitePress 开发服务器，默认访问 `http://localhost:5173`。

## 常用操作

**新建文章**：在 `posts/` 下创建 `.md` 文件

```yaml
---
title: 文章标题
date: 2026-07-13
recommend: true    # 可选，设为 true 则出现在首页推荐区
---
```

**插入图片画廊**：先把图片放到 `public/images/xxx/` 目录，然后在文章中：

```html
<ImageGallery dir="/images/xxx" />
```

**更新首页装饰**：编辑 `index.md`，四叶草通过 `.clovers` div 控制，位置和数量用一个 Python 脚本生成即可：

```python
import random
random.seed(666)
for _ in range(6):
    l = random.randint(1, 34)
    t = random.randint(2, 96)
    r = random.randint(-35, 35)
    print(f'<span class="clover" style="left:{l}%;top:{t}%;--r:{r}deg">🍀</span>')
for _ in range(6):
    l = random.randint(66, 97)
    t = random.randint(2, 96)
    r = random.randint(-35, 35)
    print(f'<span class="clover" style="left:{l}%;top:{t}%;--r:{r}deg">🍀</span>')
```