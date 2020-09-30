# Hedge v2
> v0.1.0 Developing...

这是[Hedge](https://github.com/HeerKirov/Hedge)项目的V2重构项目。  
一个基于本地数据库的图库管理App，或者叫相册App。  
* 提供详细的元数据编辑和管理功能。
* 提供基于元数据的、高复杂度的分类、查询、浏览功能。
* 提供几个图库网站的元数据解析支持。

项目使用`Electron`作为客户端框架，使用`Vue3.x`作为前端框架。  
虽然理论上是跨平台的，但是是以`macOS`作为主要平台开发的。

## Structures
项目根目录下有3个文件夹：
```bash
build/              # 存放项目最终构建脚本
    darwin/         # macOS平台的构建脚本和构建材料
        ...
client/             # 客户端项目
    ...
frontend/           # 前端项目
    ...
```

## Deploy
部署项目开发环境要分别处理客户端和前端部分。
### Client
进入`client`目录。安装全部依赖。
```sh
npm install
```

> 安装客户端依赖时，需要下载`Electron`依赖，而这可能存在网络问题。即使npm已经换源，二进制部分的下载也不会走npm源。  
> 解决这个问题，可以使用环境变量指定Electron的二进制下载源：
> ```sh
> export ELECTRON_MIRROR=https://npm.taobao.org/mirrors/electron/
> ```

由于使用到了`SQLite`，需要在安装完依赖后编译node模块。下面是macOS平台上的编译命令示例。
```bash
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
> ```bash
> sudo rm -rf $(xcode-select -print-path)
> xcode-select --install
> ```
### Frontend
进入`frontend`目录。安装全部依赖。
```sh
yarn
```
## Development
在开发中需要对项目进行实时调试。由于项目结构的问题，调试架构和运行架构是不一样的。
### Frontend
在运行时，前端会直接加载编译后的前端资源文件。而在调试时，前端通过`vite`实时运行与热更新。
```bash
yarn dev    # > vite
```
这会将前端运行在`localhost:3000`(默认)上。
### Client
客户端使用`tsc`完成编译工作。在任何客户端代码运行之前或更改之后，执行编译。
```bash
tsc
```
此外，客户端还要处理两个问题：
1. 前端现在从URL加载而不是本地加载，而且本地加载也无法加载到release模式下预期之中的前端资源；
2. 客户端的数据在release模式下会存放在userData目录下(macOS为`~/Library/Application Support`)，在开发模式下则不应该混用release模式的数据，因此需要指定本地调试数据位置。  

而这些问题事实上已经在客户端的代码构建中处理好了。通过启动参数指定App的运行模式，可以切换至debug模式。
```bash
npm run debug   # > electron . --debug-mode --debug-frontend-url http://localhost:3000 --debug-appdata-folder ./debug
```
可以看到`package.json`的`scripts.debug`选项中已经指定了默认的调试参数，即前端URL`http://localhost:3000`，数据目录`./debug`。如果有变动需要修改参数即可。
## Build
项目最终应该打包成应用程序，在release模式下运行。对于打包过程，项目已经提供了打包脚本来完成打包工作。

因为主要平台是`macOS`，目前提供的是`macOS`平台上的打包脚本。
### macOS (darwin)
进入`build/darwin`文件夹，可以看到这里的内容：
```bash
files/...               # 打包相关的资料
build.sh                # 执行此命令以完成整个打包流程
clean.sh                # 打包流程的一部分：清除打包结果
build-client.sh         # 打包流程的一部分：将客户端文件编译，并拷贝进Electron资源库(这也会清除前端资源)
build-frtonend.sh       # 打包流程的一部分：将前端文件编译，并拷贝进Electron资源库
```
运行`build.sh`，随后打包结果会出现在`build/darwin/target/Hedge.app`位置。
> **如何打包为dmg镜像？**  
> macOS应用程序有打包为镜像分发的需求。要打包为镜像，可以使用npm的`appdmg`工具包。
> ```bash
> npm install -g appdmg   # 安装
> appdmg files/dmg.json "target/Hedge.dmg"    # 打包并指定输出位置
> ```