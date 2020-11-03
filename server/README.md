# Hedge v2 Server
这是App的后台服务子项目。后台服务项目承载绝大多数业务逻辑，并静默地在后台运行，为客户端和命令行工具提供一致的业务。

## Technology Stack
* `kotlin`
* `java 11`
* `javalin`
* `ktorm`
* `sqlite3`

## Deploy
```sh
gradle  # 使用gradle安装全部依赖
```

## Development
```sh
gradle run  # 运行程序
```

## Build
```sh
gradle jlink
```
后台服务使用jlink将程序打包为可执行文件，存放于`build/image`。