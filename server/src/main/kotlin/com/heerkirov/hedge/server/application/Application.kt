package com.heerkirov.hedge.server.application

import com.heerkirov.hedge.server.components.appdata.AppDataDriverImpl
import com.heerkirov.hedge.server.components.appdata.AppdataOptions
import com.heerkirov.hedge.server.components.backend.IllustMetaExporterImpl
import com.heerkirov.hedge.server.components.backend.ThumbnailGeneratorImpl
import com.heerkirov.hedge.server.components.database.RepositoryOptions
import com.heerkirov.hedge.server.components.database.DataRepositoryImpl
import com.heerkirov.hedge.server.components.health.HealthImpl
import com.heerkirov.hedge.server.components.health.HealthOptions
import com.heerkirov.hedge.server.components.http.HttpServerImpl
import com.heerkirov.hedge.server.components.http.HttpServerOptions
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
    val healthOptions = HealthOptions(options.channel, options.userDataPath)
    val lifetimeOptions = LifetimeOptions(options.permanent)
    val repositoryOptions = RepositoryOptions(options.channel, options.userDataPath)
    val appdataOptions = AppdataOptions(options.channel, options.userDataPath)
    val serverOptions = HttpServerOptions(options.userDataPath, options.frontendFromFolder, options.forceToken, options.forcePort)

    framework {
        val health = define { HealthImpl(context, healthOptions) }
        val lifetime = define { LifetimeImpl(context, lifetimeOptions) }
        val repo = define { DataRepositoryImpl(repositoryOptions) }
        val appdata = define { AppDataDriverImpl(repo, appdataOptions) }

        val services = define {
            val relationManager = RelationManager(repo)
            val sourceManager = SourceManager(repo)

            val queryManager = QueryManager(repo)
            val queryService = QueryService(queryManager)

            val thumbnailGenerator = define { ThumbnailGeneratorImpl(appdata, repo) }
            val fileManager = FileManager(appdata, repo)
            val importMetaManager = ImportMetaManager(repo)
            val importManager = ImportManager(repo, importMetaManager)

            val annotationKit = AnnotationKit(repo)
            val annotationManager = AnnotationManager(repo)

            val authorKit = AuthorKit(repo, annotationManager)
            val topicKit = TopicKit(repo, annotationManager)
            val tagKit = TagKit(repo, annotationManager)
            val metaManager = MetaManager(repo)

            val partitionManager = PartitionManager(repo)

            val albumKit = AlbumKit(repo, metaManager)
            val albumManager = AlbumManager(repo, albumKit)

            val illustKit = IllustKit(repo, metaManager)
            val illustMetaExporter = define { IllustMetaExporterImpl(repo, illustKit, albumKit) }
            val illustManager = IllustManager(repo, illustKit, relationManager, sourceManager, partitionManager, illustMetaExporter)

            val folderKit = FolderKit(repo)
            val folderManager = FolderManager(repo, folderKit)

            val illustService = IllustService(repo, illustKit, illustManager, albumManager, folderManager, fileManager, relationManager, sourceManager, partitionManager, illustMetaExporter)
            val albumService = AlbumService(repo, albumKit, albumManager)
            val folderService = FolderService(repo, folderKit, folderManager)
            val partitionService = PartitionService(repo)
            val tagService = TagService(repo, tagKit, fileManager, illustMetaExporter)
            val annotationService = AnnotationService(repo, annotationKit)
            val authorService = AuthorService(repo, authorKit)
            val topicService = TopicService(repo, topicKit)
            val importService = ImportService(repo, fileManager, importManager, illustManager, sourceManager, importMetaManager, thumbnailGenerator)
            val settingImportService = SettingImportService(repo)
            val settingSourceSiteService = SettingSourceService(repo)

            AllServicesImpl(
                illustService,
                albumService,
                folderService,
                partitionService,
                importService,
                tagService,
                annotationService,
                authorService,
                topicService,
                settingImportService,
                settingSourceSiteService,
                queryService
            )
        }

        define { HttpServerImpl(services, health, lifetime, appdata, serverOptions) }
    }
}