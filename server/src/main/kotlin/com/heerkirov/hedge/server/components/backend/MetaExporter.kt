package com.heerkirov.hedge.server.components.backend

import com.heerkirov.hedge.server.library.framework.StatefulComponent


/**
 * 处理元信息的不重要的变化的后台任务。
 * TODO 处理illust更改后，topic/author的score的重新刷新。
 * 它的处理逻辑是根据updateTime筛选的，因此不需要持久化数据库，不过相对地，处理也更不及时。
 */
interface MetaExporter : StatefulComponent {

}