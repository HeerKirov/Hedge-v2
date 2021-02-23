# Hedge v2 Frontend
这是App的前端子项目。它运行在web容器中提供GUI。目标容器为客户端(`electron`)和浏览器(`web`)。

## Technology Stack
* `Node >= 15.8.0`
* `Vue 3.x`(`vue-cli`, `vue-router`, `jsx`)
* `TypeScript`
* `SCSS`
* `Font-Awesome free 5.x`

## Development & Debug
### Deploy
```sh
yarn    # 安装全部依赖
```
### Development
```sh
yarn dev    # 打开HMR开发服务器
```
### Build
```sh
yarn build  # 编译，输出在dist目录下
```