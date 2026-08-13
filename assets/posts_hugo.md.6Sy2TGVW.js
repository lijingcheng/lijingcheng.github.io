import{_ as a,o as n,c as p,a1 as e}from"./chunks/framework.hVCBBfmZ.js";const d=JSON.parse('{"title":"使用 Hugo + GitHub Actions 升级博客","description":"","frontmatter":{"title":"使用 Hugo + GitHub Actions 升级博客","date":"2019-12-11T08:28:43.000Z","recommend":false},"headers":[],"relativePath":"posts/hugo.md","filePath":"posts/hugo.md"}'),l={name:"posts/hugo.md"};function t(i,s,o,c,u,h){return n(),p("div",null,[...s[0]||(s[0]=[e(`<p>最近打算更新下博客模板并优化下内容的发布流程，于是放弃了多年不更新的 Octopress，在目前比较流行的静态博客生成工具 Hexo 和 Hugo 之间选择了后者，主要看重的是 Hugo 在发布时速度比较快，并且依赖较少。</p><p>关于发布流程，首先打算使用持续集成服务来提高内容发布效率，简化操作步骤，以达到提交 Markdown 源文件到 GitHub 后就能够自动完成博客站点的部署，在 Travis CI 和 GitHub Actions 之间选择了后者，对我来说最看重的就是它可以复用别人写好的 Action 并根据自己的需要来组合使用。</p><h2 id="安装-hugo" tabindex="-1">安装 Hugo <a class="header-anchor" href="#安装-hugo" aria-label="Permalink to &quot;安装 Hugo&quot;">​</a></h2><p>建议使用 Homebrew 安装 Hugo</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>brew install hugo</span></span></code></pre></div><h2 id="新建站点" tabindex="-1">新建站点 <a class="header-anchor" href="#新建站点" aria-label="Permalink to &quot;新建站点&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>hugo new site blog</span></span></code></pre></div><p>新建站点后进入 blog 目录，查看生成的文件及主要目录</p><ul><li><p>archetypes 目录下会有个模板文件，新生成的文章会以此为模板</p></li><li><p>config.toml 网站配置文件</p></li><li><p>content 用来存放 Markdown 文件</p></li><li><p>layouts 存放 html 模板文件，如果使用了第三方模板，可以将 themes 里 layouts 目录下的 html 复制过来，然后在这里修改，hugo 会优先使用这个目录下的该文件，以后再更新 themes 下的模板文件时也不用担心文件冲突问题</p></li><li><p>data 存储数据文件供模板使用</p></li><li><p>public 生成的静态网站文件会放在这里</p></li><li><p>static 可以把图片等静态资源放这里</p></li><li><p>themes 存放网站主题文件</p></li></ul><h2 id="安装主题" tabindex="-1">安装主题 <a class="header-anchor" href="#安装主题" aria-label="Permalink to &quot;安装主题&quot;">​</a></h2><p><a href="https://themes.gohugo.io/" target="_blank" rel="noreferrer">Hugo</a> 整理了很多开发者制作的主题，安装时直接将主题下载到刚创建的 themes 目录中就可以了，具体方式可参考各主题的介绍说明</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>cd blog</span></span>
<span class="line"><span>git init</span></span>
<span class="line"><span>git submodule add https://github.com/vaga/hugo-theme-m10c.git themes/m10c</span></span></code></pre></div><p>修改 config.toml</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>baseURL = &quot;https://lijingcheng.github.io&quot;</span></span>
<span class="line"><span>languageCode = &quot;zh-cn&quot;</span></span>
<span class="line"><span>title = &quot;风行&#39;s Blog&quot;</span></span>
<span class="line"><span>theme = &quot;m10c&quot;</span></span>
<span class="line"><span>paginate = 10</span></span>
<span class="line"><span></span></span>
<span class="line"><span>[params]</span></span>
<span class="line"><span>  author = &quot;风行&quot;</span></span>
<span class="line"><span>  avatar = &quot;images/avatar.png&quot;</span></span>
<span class="line"><span>  description = &quot;一直在学习的大龄程序员&quot;</span></span>
<span class="line"><span>  [[params.social]]</span></span>
<span class="line"><span>    name = &quot;github&quot;</span></span>
<span class="line"><span>    url = &quot;https://github.com/lijingcheng&quot;</span></span>
<span class="line"><span>  [[params.social]]</span></span>
<span class="line"><span>    name = &quot;instagram&quot;</span></span>
<span class="line"><span>    url = &quot;https://www.instagram.com/bj_lijingcheng/&quot;</span></span></code></pre></div><h2 id="新建文章" tabindex="-1">新建文章 <a class="header-anchor" href="#新建文章" aria-label="Permalink to &quot;新建文章&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>hugo new posts/first.md</span></span></code></pre></div><h2 id="本地预览" tabindex="-1">本地预览 <a class="header-anchor" href="#本地预览" aria-label="Permalink to &quot;本地预览&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>hugo server -D</span></span></code></pre></div><p>通过 <a href="http://localhost:1313" target="_blank" rel="noreferrer">http://localhost:1313</a> 查看，发布文章之前需要将文章内的 draft 改为 false</p><h2 id="发布文章" tabindex="-1">发布文章 <a class="header-anchor" href="#发布文章" aria-label="Permalink to &quot;发布文章&quot;">​</a></h2><p>使用 GitHub Actions 将生成的静态页面发布到 Github Pages，首先要在本地生成 ssh deploy key</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>ssh-keygen -t rsa -b 4096 -C &quot;your.email&quot; -f gh-pages -N &quot;&quot;</span></span></code></pre></div><p>在 GitHub 网站中打开项目的设置页面，将刚生成的 ssh 公钥添加到 Deploy Keys 并选择 Allow write access，然后将私钥添加到 Secrets，可以命名为 ACTIONS_DEPLOY_KEY，然后再把写好的角本放到仓库根目录下的 .github/workflow/deploy.yml 文件中，角本内容可以引用别人写好的。</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>name: github pages</span></span>
<span class="line"><span></span></span>
<span class="line"><span># 当 hugo-branch 分支发生 push 事件时执行下面任务</span></span>
<span class="line"><span>on:</span></span>
<span class="line"><span>  push:</span></span>
<span class="line"><span>    branches:</span></span>
<span class="line"><span>      - hugo-branch</span></span>
<span class="line"><span></span></span>
<span class="line"><span>env:</span></span>
<span class="line"><span>  ACTIONS_ALLOW_UNSECURE_COMMANDS: true</span></span>
<span class="line"><span></span></span>
<span class="line"><span>jobs:</span></span>
<span class="line"><span>  build-deploy:</span></span>
<span class="line"><span>    runs-on: ubuntu-latest</span></span>
<span class="line"><span>    steps:</span></span>
<span class="line"><span>    - uses: actions/checkout@v1</span></span>
<span class="line"><span>      with:</span></span>
<span class="line"><span>        submodules: true</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    - name: Setup Hugo</span></span>
<span class="line"><span>      uses: peaceiris/actions-hugo@v2.3.1</span></span>
<span class="line"><span>      with:</span></span>
<span class="line"><span>        hugo-version: &#39;0.61.0&#39;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    - name: Build</span></span>
<span class="line"><span>      run: hugo --minify</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    - name: add nojekyll</span></span>
<span class="line"><span>      run: touch ./public/.nojekyll</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    - name: Deploy</span></span>
<span class="line"><span>      uses: peaceiris/actions-gh-pages@v2.5.1</span></span>
<span class="line"><span>      env:</span></span>
<span class="line"><span>        ACTIONS_DEPLOY_KEY: \${{ secrets.ACTIONS_DEPLOY_KEY }}</span></span>
<span class="line"><span>        PUBLISH_BRANCH: master</span></span>
<span class="line"><span>        PUBLISH_DIR: ./public</span></span></code></pre></div>`,24)])])}const g=a(l,[["render",t]]);export{d as __pageData,g as default};
