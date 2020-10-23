# Lint Document
## 代码组织规范
根目录的文件组织结构如下：
```
dist/                   -- build之后的输出目录
public/                 -- 不进行打包的静态资源文件，如favicon.ico
src/                    -- 源代码
    assets/             -- 进行打包的静态资源文件
    functions/          -- 主函数库
    utils/              -- 工具函数库
    typings/            -- d.ts文件
        shim-tsx.d.ts
        ...
    plugins/            -- 注册的插件配置
    styles/             -- 公共CSS文件，在大部分位置共享的CSS样式
        index.ts        -- 导入所有在这里注册的CSS文件
        ...
    components/         -- 组件库，与业务无任何关联的、可以拿到其他项目直接复用的那类
    layouts/            -- 组件库，与业务有关联的、不属于主体组件树的、多处复用的那类
    views/              -- 视图组件库，包含根组件、构建主体组件树和视图的组件
        App.tsx         -- App根组件
        ...
    main.ts             -- 入口文件
index.html              -- 入口HTML文件
package.json            -- package.json
vite.config.ts          -- vite配置文件
```
### views
除`App.tsx`根组件外，views文件夹以组件树的形式存放视图组件。  
每一个视图组件都应当组织为:
```
views/
    组件名/              -- 组件目录
        index.scss      -- 组件内的CSS样式
        index.tsx       -- 组件文件
        ...             -- 该组件的子组件
```
此结构可递归嵌套。当组件十分简单时，可简化为标准的`views/组件名.tsx`。  
通常来说，自组件属于局部组件时，应使用简单模式；而子组件为复杂/全局组件(内嵌视图、子视图)时，应嵌套文件夹，给子组件单独的域。  
另外，内嵌的子视图也应作为子组件处理。
#### 主体组件树的样式
一般而言，主体组件树的样式不会复用。在views中的所有组件，除非无关紧要/没有专有样式，都应该首先命名其id=`组件名称的横线样式`。  
而在一个文件夹中，`index.tsx`主组件和其子组件的CSS样式都写在`index.scss`文件中。  
主组件的css selector应该为`#app #父视图组件的列表 #当前组件的名称`。这样防止重名的子视图出现问题。  
而其他子组件则单独列项为`#app #父视图组件的列表 #主组件的名称 #当前组件的名称`。  
而在一个组件内写的内部样式，使用SCSS规则写在其selector内。尽量使用无名规则和class规则，并使用`>`连接。
### layouts
这里的组件大多也要使用文件夹分域存储。其CSS样式不能再使用id，而应该使用class=`v-组件名称的横线样式`作为顶层样式，标记组件的名字。
### components
这里的组件大多使用单独的文件存储。其CSS样式不能再使用id，而应该使用class=`v-组件名称的横线样式`作为顶层样式，标记组件的名字。
### styles
首先，styles文件夹下有一个`index.ts`文件。所有在这里的CSS文件都在这个文件里导入，统一处理。然后在`main.ts`中导入`./styles`。  
这里的样式除了App全局样式之外，还有业务关联不大的公共样式。
* `App.scss`存储App的全局样式，以及全局变量。
* `bulma.scss`存储从bulma导入的样式，并应用自定义的样式更改。
* `display.scss`存储元素外观相关的样式。
* `format.scss`存储文本和显示格式相关的样式。
* `layout.scss`存储元素布局相关的样式。
* `component.scss`存储自定义或覆盖的组件式样式。
### plugins
这里并不是定义插件的地方，而是注册插件的地方。自定义插件在`functions`中定义。  
一个文件表示一个注册的插件，`export default`导出其实例，并在`main.ts`中注册。  
* `router.ts`注册路由规则。
### functions
这里定义业务相关的函数库。  
以文件夹为单位分开定义。大部分情况下，这里定义的产出都将会是`use`函数或插件。
### utils
这里定义业务无关的工具函数库。

## Tips
### 使用props还是provide/inject来传递数据？
在重耦合业务的组件树中(即视图与其层层子组件)，使用`provide/inject`来传递数据。在关键的父节点provide全部需要共享的数据，在子节点inject。`injectionKey`一般定义在父节点，使用`{}`一次提供大量数据。子节点一般会`import from '..'`。

在松耦合业务的组件、复用的组件、业务无关的组件(即边缘组件)上，使用`props`来传递数据。

此外，有些需要着重性能优化的边缘组件，也可以使用`provide/inject`传递数据以提升效率，但尽量不要让`injectionKey`在复用组件上对外暴露，这不一定可控。