package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.library.framework.Component
import com.heerkirov.hedge.server.library.framework.FrameworkContext
import com.heerkirov.hedge.server.library.framework.getComponent
import com.heerkirov.hedge.server.manager.AnnotationManager
import com.heerkirov.hedge.server.manager.AuthorManager
import com.heerkirov.hedge.server.manager.TagManager
import com.heerkirov.hedge.server.manager.TopicManager
import com.heerkirov.hedge.server.service.AnnotationService
import com.heerkirov.hedge.server.service.AuthorService
import com.heerkirov.hedge.server.service.TagService
import com.heerkirov.hedge.server.service.TopicService

interface AllServices : Component {
    val tag: TagService
    val annotation: AnnotationService
    val author: AuthorService
    val topic: TopicService
}

class AllServicesImpl(ctx: FrameworkContext) : AllServices {
    override val tag: TagService
    override val annotation: AnnotationService
    override val author: AuthorService
    override val topic: TopicService

    init {
        val repo = ctx.getComponent<DataRepository>()

        val annotationMgr = AnnotationManager(repo)
        val tagMgr = TagManager(repo, annotationMgr)
        val authorMgr = AuthorManager(repo, annotationMgr)
        val topicMgr = TopicManager(repo, annotationMgr)

        tag = TagService(repo, tagMgr)
        annotation = AnnotationService(repo, annotationMgr)
        author = AuthorService(repo, authorMgr)
        topic = TopicService(repo, topicMgr)
    }
}