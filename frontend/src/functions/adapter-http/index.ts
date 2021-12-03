import type { HttpInstance, HttpInstanceConfig, Response, ResponseOk, ResponseError, ResponseConnectionError } from "./server"
import { createHttpInstance } from "./server"
import { createWebEndpoint, WebEndpoint } from "./impl/web"
import { createSettingWebEndpoint, SettingWebEndpoint } from "./impl/setting-web"
import { createSettingServiceEndpoint, SettingServiceEndpoint } from "./impl/setting-service"
import { createSettingProxyEndpoint, SettingProxyEndpoint } from "./impl/setting-proxy"
import { createSettingImportEndpoint, SettingImportEndpoint } from "./impl/setting-import"
import { createSettingSourceEndpoint, SettingSourceEndpoint } from "./impl/setting-source"
import { createSettingMetaEndpoint, SettingMetaEndpoint } from "./impl/setting-meta"
import { createSettingQueryEndpoint, SettingQueryEndpoint } from "./impl/setting-query"
import { createIllustEndpoint, IllustEndpoint } from "./impl/illust"
import { createAlbumEndpoint, AlbumEndpoint } from "./impl/album"
import { createFolderEndpoint, FolderEndpoint } from "./impl/folder"
import { createTagEndpoint, TagEndpoint } from "./impl/tag"
import { createAnnotationEndpoint, AnnotationEndpoint } from "./impl/annotations"
import { createAuthorEndpoint, AuthorEndpoint } from "./impl/author"
import { createTopicEndpoint, TopicEndpoint } from "./impl/topic"
import { createPartitionEndpoint, PartitionEndpoint } from "./impl/partition"
import { createImportEndpoint, ImportEndpoint } from "./impl/import"
import { createSourceImageEndpoint, SourceImageEndpoint } from "./impl/source-image"
import { createSourceTagMappingEndpoint, SourceTagMappingEndpoint } from "./impl/source-tag-mapping"
import { createUtilMetaEndpoint, UtilMetaEndpoint } from "./impl/util-meta"
import { createUtilIllustEndpoint, UtilIllustEndpoint } from "./impl/util-illust"
import { createUtilQueryEndpoint, UtilQueryEndpoint } from "./impl/utils-query"

export { HttpInstance, HttpInstanceConfig, Response, ResponseOk, ResponseError, ResponseConnectionError, createHttpInstance }

export interface HttpClient {
    web: WebEndpoint
    settingWeb: SettingWebEndpoint
    settingService: SettingServiceEndpoint
    settingMeta: SettingMetaEndpoint
    settingQuery: SettingQueryEndpoint
    settingProxy: SettingProxyEndpoint
    settingImport: SettingImportEndpoint
    settingSource: SettingSourceEndpoint
    illust: IllustEndpoint
    partition: PartitionEndpoint
    album: AlbumEndpoint
    folder: FolderEndpoint
    tag: TagEndpoint
    author: AuthorEndpoint
    topic: TopicEndpoint
    annotation: AnnotationEndpoint
    import: ImportEndpoint
    sourceImage: SourceImageEndpoint
    sourceTagMapping: SourceTagMappingEndpoint
    metaUtil: UtilMetaEndpoint
    illustUtil: UtilIllustEndpoint
    queryUtil: UtilQueryEndpoint
}

export function createHttpClient(http: HttpInstance): HttpClient {
    return {
        web: createWebEndpoint(http),
        settingWeb: createSettingWebEndpoint(http),
        settingService: createSettingServiceEndpoint(http),
        settingMeta: createSettingMetaEndpoint(http),
        settingQuery: createSettingQueryEndpoint(http),
        settingProxy: createSettingProxyEndpoint(http),
        settingImport: createSettingImportEndpoint(http),
        settingSource: createSettingSourceEndpoint(http),
        illust: createIllustEndpoint(http),
        partition: createPartitionEndpoint(http),
        album: createAlbumEndpoint(http),
        folder: createFolderEndpoint(http),
        tag: createTagEndpoint(http),
        author: createAuthorEndpoint(http),
        topic: createTopicEndpoint(http),
        annotation: createAnnotationEndpoint(http),
        import: createImportEndpoint(http),
        sourceImage: createSourceImageEndpoint(http),
        sourceTagMapping: createSourceTagMappingEndpoint(http),
        metaUtil: createUtilMetaEndpoint(http),
        illustUtil: createUtilIllustEndpoint(http),
        queryUtil: createUtilQueryEndpoint(http)
    }
}
