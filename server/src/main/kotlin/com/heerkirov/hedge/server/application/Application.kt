package com.heerkirov.hedge.server.application

import com.heerkirov.hedge.server.components.appdata.AppDataDriverImpl
import com.heerkirov.hedge.server.components.backend.EntityExporterImpl
import com.heerkirov.hedge.server.components.backend.TagExporterImpl
import com.heerkirov.hedge.server.components.backend.FileGeneratorImpl
import com.heerkirov.hedge.server.components.configuration.ConfigurationDriverImpl
import com.heerkirov.hedge.server.components.database.DataRepositoryImpl
import com.heerkirov.hedge.server.components.health.HealthImpl
import com.heerkirov.hedge.server.components.http.HttpServerImpl
import com.heerkirov.hedge.server.components.http.HttpServerOptions
import com.heerkirov.hedge.server.components.http.WebControllerImpl
import com.heerkirov.hedge.server.components.lifetime.LifetimeImpl
import com.heerkirov.hedge.server.components.lifetime.LifetimeOptions
import com.heerkirov.hedge.server.components.manager.*
import com.heerkirov.hedge.server.components.kit.*
import com.heerkirov.hedge.server.components.manager.query.QueryManager
import com.heerkirov.hedge.server.components.service.*
import com.heerkirov.hedge.server.library.framework.define
import com.heerkirov.hedge.server.library.framework.framework

/**
 * 应用程序的入口函数。在这里对整个应用程序进行装配。
 */
fun runApplication(options: ApplicationOptions) {
    val lifetimeOptions = LifetimeOptions(options.permanent)
    val serverOptions = HttpServerOptions(options.frontendPath, options.forceToken, options.forcePort)

    framework {
        val health = define { HealthImpl(options.channelPath) }
        val configuration = define { ConfigurationDriverImpl(options.channelPath) }
        val lifetime = define { LifetimeImpl(context, lifetimeOptions) }
        val appdata = define { AppDataDriverImpl(options.channelPath) }
        val repo = define { DataRepositoryImpl(configuration) }

        val webController = WebControllerImpl()

        val services = define {
            val queryManager = QueryManager(repo)
            val queryService = QueryService(queryManager)

            val sourceTagManager = SourceTagManager(repo)
            val sourceManager = SourceImageManager(repo, queryManager, sourceTagManager)
            val sourceMappingManager = SourceMappingManager(repo, sourceTagManager)
            val sourceImageService = SourceImageService(repo, sourceManager, queryManager)
            val sourceMappingService = SourceMappingService(repo, sourceMappingManager)

            val thumbnailGenerator = define { FileGeneratorImpl(configuration, repo) }
            val fileManager = FileManager(configuration, repo)
            val importMetaManager = ImportMetaManager(repo)
            val importManager = ImportManager(repo, importMetaManager)

            val annotationKit = AnnotationKit(repo)
            val annotationManager = AnnotationManager(repo)

            val tagExporter = define { TagExporterImpl(repo) }
            val authorKit = AuthorKit(repo, annotationManager)
            val topicKit = TopicKit(repo, annotationManager)
            val tagKit = TagKit(repo, annotationManager)
            val metaUtilKit = MetaUtilKit(repo)
            val metaManager = MetaManager(repo)
            val metaHistoryManager = MetaHistoryManager(repo)
            val metaService = MetaUtilService(repo, metaUtilKit, metaManager, metaHistoryManager)

            val partitionManager = PartitionManager(repo)

            val illustKit = IllustKit(repo, metaManager)
            val albumKit = AlbumKit(repo, metaManager)
            val entityExporter = define { EntityExporterImpl(repo, illustKit, albumKit) }
            val illustManager = IllustManager(repo, illustKit, sourceManager, partitionManager, entityExporter)
            val albumManager = AlbumManager(repo, albumKit, illustManager, entityExporter)
            val associateManager = AssociateManager(repo)

            val folderKit = FolderKit(repo)
            val folderManager = FolderManager(repo, folderKit)

            val illustService = IllustService(repo, illustKit, illustManager, albumManager, associateManager, folderManager, fileManager, sourceManager, partitionManager, queryManager, entityExporter)
            val albumService = AlbumService(repo, albumKit, albumManager, illustManager, queryManager)
            val associateService = AssociateService(repo, associateManager)
            val folderService = FolderService(repo, folderKit, folderManager, queryManager)
            val partitionService = PartitionService(repo)
            val annotationService = AnnotationService(repo, annotationKit, queryManager)
            val tagService = TagService(repo, tagKit, fileManager, queryManager, tagExporter, sourceMappingManager, entityExporter)
            val authorService = AuthorService(repo, authorKit, queryManager, sourceMappingManager, entityExporter)
            val topicService = TopicService(repo, topicKit, queryManager, sourceMappingManager, entityExporter)
            val importService = ImportService(repo, fileManager, importManager, illustManager, sourceManager, importMetaManager, thumbnailGenerator)

            val illustUtilService = IllustUtilService(repo)

            val settingAppdataService = SettingAppdataService(appdata, webController)
            val settingMetaService = SettingMetaService(repo)
            val settingQueryService = SettingQueryService(repo)
            val settingImportService = SettingImportService(repo)
            val settingSiteService = SettingSourceService(repo)
            val settingSpiderService = SettingSpiderService(repo)

            AllServices(
                illustService,
                albumService,
                associateService,
                folderService,
                partitionService,
                importService,
                tagService,
                annotationService,
                authorService,
                topicService,
                sourceImageService,
                sourceMappingService,
                settingAppdataService,
                settingMetaService,
                settingQueryService,
                settingImportService,
                settingSiteService,
                settingSpiderService,
                queryService,
                metaService,
                illustUtilService
            )
        }

        define { HttpServerImpl(services, health, lifetime, appdata, repo, webController, serverOptions) }
    }
}