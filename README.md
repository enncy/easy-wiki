---ewiki-config---
mount=.markdown-body
create_at=2024/7/12 18:54:27
update_at=2024/7/14 12:03:34
sidebar_url_base=https://enncy.github.io/easy-wiki/
sidebar=首页
title=EWiki Docs
---ewiki-config---


# easy-wiki docs

::: info
项目地址：[https://github.com/enncy/easy-wiki](https://github.com/enncy/easy-wiki)
:::

> 极致简单的 wiki 搭建工具
> 快速构建使用请查看 [快速构建教程，一秒部署上线](https://enncy.github.io/easy-wiki//dist/1_%E5%BF%AB%E9%80%9F%E6%9E%84%E5%BB%BA.html)

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
# 监听文件变化，并构建对应的文件
ewiki watch  
# 构建文档
ewiki
```

> 使用 ewiki 后会首先判断项目文件夹是否初始化，没有初始化则运行 `ewiki init` 命令，然后在进行构建

**项目文件夹解析**

| 文件名            | 说明                                                     |
| ----------------- | -------------------------------------------------------- |
| ewiki.config.json | 项目配置文件                                             |
| sources           | 放置 md 文档文件夹                                       |
| plugins           | 插件文件夹                                               |
| dist              | 输出文件夹                                               |
| README.md         | 项目主入口文件，构建后会在同目录生成 index.html 入口文件 |
| template.html     | 默认模版文件                                             |

**默认项目配置文件**

> 百度百科：[glob 表达式](<https://en.wikipedia.org/wiki/Glob_(programming)>)

```json
{
  // 项目配置文件加载路径，可以有多个，内容为 glob 表达式
  "sources": ["./sources/**/*.md"],
  // 插件文件加载路径，可以有多个，内容为 glob 表达式
  "plugins": ["./plugins/**/*.js"],
  // 输出路径
  "output_folder": "./dist",
  // 忽略文件，内容为 glob 表达式
  "ignore_sources": ["./sources/**/*.ignore.md"],
  // 忽略插件，内容为 glob 表达式
  "ignore_plugins": ["./plugins/**/*.ignore.js"],
  // 默认模版文件
  "html_template": "./template.html",
  // 默认样式文件
  "styles": ["./style.css"],
  // 默认入口文档，构建后会在同目录生成 index.html 入口文件
  "readme": "./README.md",
  // 默认入口文档挂载点
  "readme_mount": "body",
  // Markdown-It实例化参数
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