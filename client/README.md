# Hedge v2 Client
这是App的客户端子项目。它承载大部分业务逻辑以及App主体的运行功能。

## Technology Stack
* `electron`
* `typescript`
* `sqlite3`
* `koa`

## Deploy
```sh
npm install     # 使用npm安装全部依赖
```

> 安装客户端依赖时，需要下载`Electron`依赖，而这可能存在网络问题。即使npm已经换源，二进制部分的下载也不会走npm源。  
> 解决这个问题，可以使用环境变量指定Electron的二进制下载源：
> ```sh
> export ELECTRON_MIRROR=https://npm.taobao.org/mirrors/electron/
> ```

由于使用到了`SQLite`，需要在安装完依赖后编译node模块。下面是macOS平台上的编译命令示例。
```sh
cd node_modules
./node-gyp/bin/node-gyp.js rebuild \
    --target=10.1.2 \
    --arch=x64 \
    --target_platform=darwin \
    --dist-url=https://atom.io/download/electron/ \
    --module_name=node_sqlite3 
    --module_path=./sqlite3/lib/building/electron-v10.1-darwin-x64
```
> 在macOS上，编译可能会遇到`No Xcode or CLT version detected!`问题。此时可以尝试重装XCode工具。
> ```sh
> sudo rm -rf $(xcode-select -print-path)
> xcode-select --install
> ```

## Development
客户端使用`tsc`完成编译工作。在任何客户端代码运行之前或更改之后，执行编译。
```sh
tsc     # 编译更新源代码
```
此外，客户端还要处理两个问题：
1. 在开发模式实时预览的情况下，前端从URL而不是本地文件加载，且本地加载也无法加载到release模式下预期之中的前端资源；
2. 客户端的数据在release模式下会存放在userData目录下(macOS为`~/Library/Application Support`)，在开发模式下则不应该混用release模式的数据，因此需要指定本地调试数据位置。  

而这些问题已在客户端的代码构建中处理。通过启动参数指定App的运行模式，可切换至debug模式。
```sh
npm run debug   # > electron . --debug-mode --debug-frontend-url http://localhost:3000 --debug-appdata-folder ./debug
```
可以看到`package.json`的`scripts.debug`选项中已经指定了默认的调试参数。