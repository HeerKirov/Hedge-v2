package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.library.framework.Component

class AllServices(val illust: IllustService,
                  val album: AlbumService,
                  val associate: AssociateService,
                  val folder: FolderService,
                  val partition: PartitionService,
                  val import: ImportService,
                  val tag: TagService,
                  val annotation: AnnotationService,
                  val author: AuthorService,
                  val topic: TopicService,
                  val sourceImage: SourceImageService,
                  val sourceMappingService: SourceMappingService,
                  val settingAppdata: SettingAppdataService,
                  val settingMeta: SettingMetaService,
                  val settingQuery: SettingQueryService,
                  val settingImport: SettingImportService,
                  val settingSource: SettingSourceService,
                  val queryService: QueryService,
                  val metaUtilService: MetaUtilService,
                  val illustUtilService: IllustUtilService) : Component