# Hedge v2 Client
这是App的客户端子项目。它是主要的对用户交互方式。承载后台服务启动管理、前端对接、app基本数据管理功能。

## Technology Stack
* `electron`
* `typescript`

## Deploy
```sh
npm install     # 使用npm安装全部依赖
```

> 安装客户端依赖时，需要下载`Electron`依赖，而这可能存在网络问题。即使npm已经换源，二进制部分的下载也不会走npm源。  
> 解决这个问题，可以使用环境变量指定Electron的二进制下载源：
> ```sh
> export ELECTRON_MIRROR=https://npm.taobao.org/mirrors/electron/
> ```

## Development
客户端使用`tsc`完成编译工作。在任何客户端代码运行之前或更改之后，执行编译。
```sh
tsc     # 编译更新源代码
```
在开发过程中，有必要使用与生产环境隔离的数据库；此外，客户端还联系着前端和后台服务，这两部分都需要不同程度的开发调试。为此客户端提供了相关的调试选项。  
```sh
cp args.dev args.dev.local
npm run debug
```
复制一份开发模式启动参数。执行debug script以开发模式启动。随后，编辑`args.dev.local`文件以调整启动参数。
```sh
--debug-mode    # 在调试模式启动，启用devtool。指定此参数，下列其他参数才有效。
--local-data-path   # 指定一个文件夹作为开发模式数据文件夹。
--frontend-from-url     # 从指定URL加载前端资源，用于前端业务开发。
--frontend-from-folder  # 从指定文件夹加载前端资源，用于前端生产模式+客户端开发模式。
--server-fron-url       # 从指定URL调用后台服务，用于后台服务业务开发。使用此选项时后台服务启动管理功能被禁用。
--server-from-folder    # 从指定文件夹调用后台服务程序，用于后台服务生产模式+客户端开发模式。使用此选项时资源管理功能被禁用。
--server-from-resource  # 从指定压缩文件调用后台服务程序，用于后台服务生产模式+资源管理功能调试。
```
