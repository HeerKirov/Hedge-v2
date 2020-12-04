package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.library.framework.Component
import com.heerkirov.hedge.server.library.framework.FrameworkContext
import com.heerkirov.hedge.server.library.framework.getComponent
import com.heerkirov.hedge.server.manager.AnnotationManager
import com.heerkirov.hedge.server.manager.TagManager
import com.heerkirov.hedge.server.service.AnnotationService
import com.heerkirov.hedge.server.service.TagService

interface AllServices : Component {
    val tag: TagService
    val annotation: AnnotationService
}

class AllServicesImpl(ctx: FrameworkContext) : AllServices {
    override val tag: TagService
    override val annotation: AnnotationService

    init {
        val repo = ctx.getComponent<DataRepository>()

        val annotationMgr = AnnotationManager(repo)
        val tagMgr = TagManager(repo, annotationMgr)

        tag = TagService(repo, tagMgr)
        annotation = AnnotationService(repo, annotationMgr)
    }
}