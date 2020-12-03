package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.library.framework.Component
import com.heerkirov.hedge.server.library.framework.FrameworkContext
import com.heerkirov.hedge.server.library.framework.getComponent
import com.heerkirov.hedge.server.manager.TagManager
import com.heerkirov.hedge.server.service.TagService

interface AllServices : Component {
    val tag: TagService
}

class AllServicesImpl(ctx: FrameworkContext) : AllServices {
    override val tag: TagService

    init {
        val repo = ctx.getComponent<DataRepository>()

        val tagMgr = TagManager(repo)

        tag = TagService(repo, tagMgr)
    }
}