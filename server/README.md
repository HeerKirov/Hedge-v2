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
--channel-path          # 必选参数，指定启动的channel的资源根目录
--frontend-path         # 必须按参数，指定引用的前端资源根目录
--force-port            # 强制指定此端口启动，用于开发
--force-token           # 强制指定此token启动，用于开发
--permanent             # 强制永不自动退出，用于开发
```
### Build
```sh
gradle jlink
```
后台服务使用jlink将程序打包为可执行文件，存放于`build/image`。