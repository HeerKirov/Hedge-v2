package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.library.framework.Component

interface AllServices : Component {
    val import: ImportService
    val tag: TagService
    val annotation: AnnotationService
    val author: AuthorService
    val topic: TopicService
    val settingSourceSite: SettingSourceSiteService
}

class AllServicesImpl(
    override val import: ImportService,
    override val tag: TagService,
    override val annotation: AnnotationService,
    override val author: AuthorService,
    override val topic: TopicService,
    override val settingSourceSite: SettingSourceSiteService
) : AllServices