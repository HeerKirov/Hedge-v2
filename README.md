# Hedge v2
> v0.1.0 Developing...

这是[Hedge](https://github.com/HeerKirov/Hedge)项目的V2重构项目。  
一个基于本地数据库的图库管理App，或者叫相册App。App不提供开箱即用的简单相册功能，它的主要功能为：  
* 提供详细的元数据编辑和管理功能。
* 提供基于元数据的、高复杂度的分类、查询、浏览功能。
* 提供几个图库网站的元数据解析支持。

以`macOS`作为主要开发和运行平台。

## Structures
```sh
build/              # 存放项目最终构建脚本
    darwin/         # macOS平台的构建脚本和构建材料
        ...
client/             # 客户端项目
    ...
frontend/           # 前端项目
    ...
```

## Sub Project
进入各个子项目获取该子项目的内容和开发规范。
* Frontend [README.md](https://github.com/HeerKirov/Hedge-v2/tree/master/frontend/README.md)
* Client [README.md](https://github.com/HeerKirov/Hedge-v2/tree/master/client/README.md)

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