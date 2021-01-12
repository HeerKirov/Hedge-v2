package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.library.framework.Component

interface AllServices : Component {
    val illust: IllustService
    val album: AlbumService
    val partition: PartitionService
    val import: ImportService
    val tag: TagService
    val annotation: AnnotationService
    val author: AuthorService
    val topic: TopicService
    val settingImport: SettingImportService
    val settingSource: SettingSourceService
}

class AllServicesImpl(
    override val illust: IllustService,
    override val album: AlbumService,
    override val partition: PartitionService,
    override val import: ImportService,
    override val tag: TagService,
    override val annotation: AnnotationService,
    override val author: AuthorService,
    override val topic: TopicService,
    override val settingImport: SettingImportService,
    override val settingSource: SettingSourceService
) : AllServices