package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.appdata.AppDataDriver
import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.library.framework.Component
import com.heerkirov.hedge.server.library.framework.FrameworkContext
import com.heerkirov.hedge.server.library.framework.getComponent
import com.heerkirov.hedge.server.manager.*
import com.heerkirov.hedge.server.service.*

interface AllServices : Component {
    val import: ImportService
    val tag: TagService
    val annotation: AnnotationService
    val author: AuthorService
    val topic: TopicService
    val settingSourceSite: SettingSourceSiteService
}

class AllServicesImpl(ctx: FrameworkContext) : AllServices {
    override val import: ImportService
    override val tag: TagService
    override val annotation: AnnotationService
    override val author: AuthorService
    override val topic: TopicService
    override val settingSourceSite: SettingSourceSiteService

    init {
        val appdata = ctx.getComponent<AppDataDriver>()
        val repo = ctx.getComponent<DataRepository>()

        val sourceImageMgr = SourceImageManager(repo)
        val importMgr = ImportManager(repo)
        val fileMgr = FileManager(appdata, repo)

        val annotationMgr = AnnotationManager(repo)
        val tagMgr = TagManager(repo, annotationMgr)
        val authorMgr = AuthorManager(repo, annotationMgr)
        val topicMgr = TopicManager(repo, annotationMgr)

        val illustMgr = IllustManager(repo, sourceImageMgr, tagMgr, authorMgr, topicMgr)

        import = ImportService(repo, fileMgr, importMgr, illustMgr, sourceImageMgr)
        tag = TagService(repo, tagMgr, fileMgr)
        annotation = AnnotationService(repo, annotationMgr)
        author = AuthorService(repo, authorMgr)
        topic = TopicService(repo, topicMgr)
        settingSourceSite = SettingSourceSiteService(repo)
    }
}