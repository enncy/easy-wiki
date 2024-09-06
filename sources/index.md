---ewiki-config---
create_at=2024/7/12 18:54:27
update_at=2024/9/6 15:55:16
sidebar=首页
---ewiki-config---





# easy-wiki docs

> 极致简单的 wiki 搭建工具，本教程也是使用 easy-wiki 构建的文档网站
> 快速构建使用请查看 [快速构建教程，一秒部署上线](./文档列表/1_快速构建.md)

::: info
项目地址：[https://github.com/enncy/easy-wiki](https://github.com/enncy/easy-wiki)
:::

::: warn
本文适用于有一定基础的程序员快速搭建文档网站，因为构建出来的网页非常简约（模仿 wiki 页面），可以直接使用，或者可以通过插件自定义页面。
:::

**安装**

```sh
npm install ewiki -g
```

::: warn 注意
如果是安装到当前目录，则需要使用 `npx ewiki` 命令
只有添加 `-g` 选项安装到全局才可以使用 单个的 `ewiki` 命令
:::

**命令**

```sh
# 初始化项目
ewiki init
# 监听文件变化，并构建对应的文件，执行前以及结束后会全部构建一遍文件
ewiki watch
# 构建全部文档
ewiki
```

> 使用 ewiki 后会首先判断项目文件夹是否初始化，没有初始化则运行 `ewiki init` 命令，然后在进行构建

**项目文件夹解析**

| 文件名            | 说明                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------- |
| ewiki.config.json | 项目配置文件                                                                                 |
| sources           | 资源文件夹，存放 md,png,video 等等各种格式的资源文件                                         |
| sources/index.md  | 项目主入口文件，构建后会在输出目录生成 index.html 入口文件，（一般网站访问都会使用这个文件） |
| plugins           | 插件文件夹                                                                                   |
| dist              | 输出文件夹                                                                                   |
| template.html     | 默认模版文件                                                                                 |
| style.css         | 默认样式                                                                                     |

**默认项目配置文件**

> 百度百科：[glob 表达式](<https://en.wikipedia.org/wiki/Glob_(programming)>)

```json
{
  // 项目资源文件夹，包含 md,png,video 等等各种格式的资源文件
  // 使用内置插件 pathfinder 后将会解析相对路径
  // 例如：  ./ , ../xxx.md  解析为相应的文件，../xxx.md 将会被解析为对应的 html文件链接
  "sources_folder": "./sources",
  // 输出路径
  "output_folder": "./dist",
  // 插件文件加载路径，可以有多个，支持 glob 表达式
  // 这里注意如果是特殊的 node_modules 下的插件可以只写 npm 项目名，会自动加载 node_modules/ewiki/plugins 下的插件，优先级比 ignore_plugins 高
  // 例如使用官方插件: "plugins": ["./plugins/**/*.js","ewiki"]
  "plugins": ["./plugins/**/*.js"],
  // 忽略文件，支持 glob 表达式，请勿删除  "./node_modules/**/*.md" ，否则会加载  node_modules 下的 md 文件
  "ignore_sources": [
    "./**/*.ignore.md",
    "./**/*.ignore.png",
    "./**/*.ignore.video",
    "./node_modules/**/*.md"
  ],
  // 忽略插件，支持 glob 表达式，请勿删除 "./node_modules/**/*.js" ，否则会加载  node_modules 下的 js 文件
  "ignore_plugins": ["./**/*.ignore.js", "./node_modules/**/*.js"],
  // 默认模版文件，不支持 glob 表达式
  "html_template": "./template.html",
  // 默认样式文件，不支持 glob 表达式
  "styles": ["./style.css"],
  // 本地测试服务以及线上配置，使用 ewiki watch 命令后会开启测试服务，访问控制台后即可查看效果
  "server": {
    "port": 3019,
    // 根路径，如果直接由域名访问则为空，如果是子路径则填写子路径，例如： "base_url":"/easy-wiki"
    "base_url": "/"
  },
  // 默认入口文档挂载点
  "markdown_mount": ".markdown-body",
  // 默认的Markdown-It实例化参数，文档：https://markdown-it.github.io/markdown-it/#MarkdownIt.new
  "markdown_it_config": {
    "html": true,
    "xhtmlOut": false,
    "breaks": true,
    "langPrefix": "language-",
    "linkify": false,
    "typographer": true,
    "quotes": "“”‘’"
  }
}
```

**默认`Markdown-It`的实例化参数**

> 参数说明： [https://markdown-it.github.io/markdown-it/#MarkdownIt.new](https://markdown-it.github.io/markdown-it/#MarkdownIt.new)

## 更多文档

可以在侧边栏查看更多文档