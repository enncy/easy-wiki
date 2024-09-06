# easy-wiki
 

## 详细教程
教程： [https://enncy.github.io/easy-wiki/](https://enncy.github.io/easy-wiki/)

DEMO：[https://enncy.github.io/easy-wiki/](https://enncy.github.io/easy-wiki/)
 

## 快速构建

克隆初始化模版 

> 项目环境：Node.js ，没有安装的请先安装 [Node.js](https://nodejs.org/zh-cn/)

```sh
# 1.安装 ewiki  
npm i ewiki -g
# 2.克隆项目模版，my-wiki 为你的项目名称
git clone -b template git@github.com:enncy/easy-wiki.git my-wiki
# 3.进入项目文件夹
cd my-wiki
# 4.编译项目
npx ewiki
```

编译后根据配置文件打包到 /dist 文件下，查看 index.html 即为文档入口    
`（注意：其他链接文档需要本地启动 npx ewiki watch 命令，或者部署后才能正常访问！）`

编译示例：

![8d8c7a0087217fabfbb5b1b621238765](https://github.com/user-attachments/assets/eee1145e-f906-4c41-8092-c81ad153aedd)

