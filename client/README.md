# Hedge v2 Client
这是App的客户端子项目。它是主要的对用户交互方式。承载后台服务启动管理、前端对接、app基本数据管理功能。

## Technology Stack
* `node >= 14.14.0`
* `electron`
* `typescript`

## Development & Debug
### Deploy
```sh
npm install     # 使用npm安装全部依赖
```

> 安装客户端依赖时，需要下载`Electron`依赖，而这可能存在网络问题。即使npm已经换源，二进制部分的下载也不会走npm源。  
> 解决这个问题，可以使用环境变量指定Electron的二进制下载源：
> ```sh
> export ELECTRON_MIRROR=https://npm.taobao.org/mirrors/electron/
> ```

### Development
客户端使用`tsc`完成编译工作。在任何客户端代码运行之前或更改之后，执行编译。
```sh
tsc     # 编译更新源代码
```
在开发过程中，有必要使用与生产环境隔离的数据库；此外，客户端还联系着前端和后台服务，这两部分都需要不同程度的开发调试。为此客户端提供了相关的调试选项。  
```sh
cp debug.args.sh debug.args.local.sh
npm run debug
```
复制一份`debug.args.sh`作为开发模式启动参数。执行debug script以开发模式启动。随后，编辑`debug.args.local.sh`文件以调整启动参数。
```sh
--debug-mode    # 在调试模式启动，启用devtool。指定此参数，下列其他参数才有效。
--local-data-path   # 指定一个文件夹作为开发模式数据文件夹。
--frontend-from-url     # 从指定URL加载前端资源，用于前端业务开发。
--frontend-from-folder  # 从指定文件夹加载前端资源，用于前端生产模式+客户端开发模式。
--server-fron-url       # 从指定URL调用后台服务，用于后台服务业务开发。使用此选项时后台服务启动管理功能被禁用。
--server-from-folder    # 从指定文件夹调用后台服务程序，用于后台服务生产模式+客户端开发模式。使用此选项时资源管理功能被禁用。
--server-from-resource  # 从指定压缩文件调用后台服务程序，用于后台服务生产模式+资源管理功能调试。
```

## Build
项目最终将打包为特定平台的应用程序，在release模式下运行。在打包完成后，项目的各个组成部分都会以electron程序为基础组装在一起。  
项目提供了脚本去完成这部分的工作。在构建脚本运行以前，首先确保项目的各个部分都已经在开发模式下部署完毕。
```sh
npm run build
```
这将运行默认的构建流程。构建产物位于`/dist`目录下。
### 自定义构建
除默认流程外，还可以添加命令以执行部分构建。
```sh
clean               # 清空dist目录
build-client        # 对client项目执行编译
build-frontend      # 对frontend项目执行生产环境编译
build-server        # 对server项目执行生产环境编译打包
build-cli           # 对cli项目执行生产环境编译打包
install-app         # 在dist目录下添加electron应用程序的内容
install-client      # 将client资源添加到electron程序
install-frontend    # 将frontend资源添加到electron应用程序
install-server      # 将server资源添加到electron应用程序
install-cli         # 将cli资源添加到electron应用程序
```
### 编译平台
因为主要平台是`macOS`，目前仅提供`macOS`平台上的打包脚本。
### macOS (darwin)
默认构建的打包产物是`/dist/Hedge.app`。

> **如何打包为dmg镜像？**  
> macOS应用程序有打包为镜像分发的需求。要打包为镜像，可以使用npm的`appdmg`工具包。
> ```bash
> npm install -g appdmg   # 安装
> appdmg files/dmg.json "target/Hedge.dmg"    # 打包并指定输出位置
> ```