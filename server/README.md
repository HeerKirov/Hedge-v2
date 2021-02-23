# Hedge v2 Server
这是App的后台服务子项目。后台服务提供应用程序业务逻辑，静默地在后台运行，为客户端和命令行工具提供一致的服务。

## Technology Stack
* `Java >= 11`
* `Kotlin`
* `Javalin`
* `Ktorm`
* `SQLite3`

## Development & Debug
### Deploy
```sh
gradle  # 使用gradle安装全部依赖
```
### Development
```sh
gradle run  # 运行程序
```
在调试运行时，需要为程序指定必须的启动参数。
```sh
--channel               # 必选参数，指定启动的channel
--user-data             # 必选参数，指定userData的目录路径
--debug-mode            # 指定程序是否在开发模式下启动
--frontend-from-folder  # 指定此参数时，从此路径，而不是默认的userData路径下寻找前端资源
--force-port            # 强制指定此端口启动，用于开发
--force-token           # 强制指定此token启动，用于开发
--permanent             # 强制永不自动退出，用于开发
```
### Build
```sh
gradle jlink
```
后台服务使用jlink将程序打包为可执行文件，存放于`build/image`。