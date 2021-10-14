import { date, datetime, LocalDate, LocalDateTime } from "@/utils/datetime"
import { HttpInstance, Response } from "../server"
import {
    ConflictingGroupMembersError,
    NotFound, ParamError,
    ParamNotRequired, ParamRequired,
    ResourceNotExist,
    ResourceNotSuitable
} from "../exception"
import { IdResponse, LimitAndOffsetFilter, LimitFilter, ListResult, OrderList } from "./generic"
import { SimpleAlbum } from "./album"
import { DepsTopic } from "./topic"
import { DepsAuthor } from "./author"
import { DepsTag } from "./tag"
import { SourceTag } from "./source-tag-mapping"

export function createIllustEndpoint(http: HttpInstance): IllustEndpoint {
    return {
        list: http.createQueryRequest("/api/illusts", "GET", {
            parseResponse: ({ total, result }: ListResult<any>) => ({total, result: result.map(mapToIllust)}),
            parseQuery: mapFromIllustFilter
        }),
        collection: {
            create: http.createDataRequest("/api/illusts/collection", "POST"),
            get: http.createPathRequest(id => `/api/illusts/collection/${id}`, "GET", {
                parseResponse: mapToDetailIllust
            }),
            update: http.createPathDataRequest(id => `/api/illusts/collection/${id}`, "PATCH"),
            delete: http.createPathRequest(id => `/api/illusts/collection/${id}`, "DELETE"),
            relatedItems: {
                get: http.createPathQueryRequest(id => `/api/illusts/collection/${id}/related-items`, "GET", {
                    parseResponse: mapToCollectionRelatedItems
                }),
                update: http.createPathDataRequest(id => `/api/illusts/collection/${id}/related-items`, "PATCH")
            },
            images: {
                get: http.createPathQueryRequest(id => `/api/illusts/collection/${id}/images`, "GET"),
                update: http.createPathDataRequest(id => `/api/illusts/collection/${id}/images`, "PUT")
            }
        },
        image: {
            get: http.createPathRequest(id => `/api/illusts/image/${id}`, "GET", {
                parseResponse: mapToDetailIllust
            }),
            update: http.createPathDataRequest(id => `/api/illusts/image/${id}`, "PATCH", {
                parseData: mapFromImageUpdateForm
            }),
            delete: http.createPathRequest(id => `/api/illusts/image/${id}`, "DELETE"),
            relatedItems: {
                get: http.createPathQueryRequest(id => `/api/illusts/image/${id}/related-items`, "GET", {
                    parseResponse: mapToImageRelatedItems
                }),
                update: http.createPathDataRequest(id => `/api/illusts/image/${id}/related-items`, "PATCH")
            },
            originData: {
                get: http.createPathRequest(id => `/api/illusts/image/${id}/origin-data`, "GET"),
                update: http.createPathDataRequest(id => `/api/illusts/image/${id}/origin-data`, "PATCH")
            },
            fileInfo: {
                get: http.createPathRequest(id => `/api/illusts/image/${id}/file-info`, "GET", {
                    parseResponse: mapToImageFileInfo
                })
            }
        },
        associates: {
            create: http.createDataRequest("/api/associates", "POST"),
            get: http.createPathQueryRequest(id => `/api/associates/${id}`, "GET"),
            update: http.createPathDataRequest(id => `/api/associates/${id}`, "PUT"),
            delete: http.createPathRequest(id => `/api/associates/${id}`, "DELETE")
        }
    }
}

function mapToIllust(data: any): Illust {
    return {
        id: <number>data["id"],
        type: <IllustType>data["type"],
        childrenCount: <number | null>data["childrenCount"],
        file: <string>data["file"],
        thumbnailFile: <string>data["thumbnailFile"],
        score: <number | null>data["score"],
        favorite: <boolean>data["favorite"],
        tagme: <Tagme[]>data["tagme"],
        orderTime: datetime.of(<string>data["orderTime"])
    }
}

function mapToDetailIllust(data: any): DetailIllust {
    return {
        ...mapToIllust(data),
        fileId: <number>data["fileId"],
        topics: <DepsTopic[]>data["topics"],
        authors: <DepsAuthor[]>data["authors"],
        tags: <DepsTag[]>data["tags"],
        description: <string>data["description"],
        originDescription: <string>data["originDescription"],
        originScore: <number | null>data["originScore"],
        partitionTime: date.of(<string>data["partitionTime"]),
        createTime: datetime.of(<string>data["createTime"]),
        updateTime: datetime.of(<string>data["updateTime"])
    }
}

function mapToCollectionRelatedItems(data: any): CollectionRelatedItems {
    return {
        associate: data["associate"] != null ? mapToAssociate(data["associate"]) : null
    }
}

function mapToImageFileInfo(data: any): ImageFileInfo {
    return {
        file: <string>data["file"],
        extension: <string>data["extension"],
        size: <number>data["size"],
        thumbnailSize: <number | null>data["thumbnailSize"],
        resolutionWidth: <number>data["resolutionWidth"],
        resolutionHeight: <number>data["resolutionHeight"],
        createTime: datetime.of(<string>data["createTime"])
    }
}

function mapToImageRelatedItems(data: any): ImageRelatedItems {
    return {
        collection: <IllustParent | null>data["collection"],
        albums: <SimpleAlbum[]>data["albums"],
        associate: data["associate"] != null ? mapToAssociate(data["associate"]) : null
    }
}

function mapToAssociate(data: any): Associate {
    return {
        id: <number>data["id"],
        totalCount: <number>data["totalCount"],
        items: (<any[]>data["items"]).map(mapToIllust)
    }
}

function mapFromImageUpdateForm(form: ImageUpdateForm): any {
    return {
        ...form,
        partitionTime: form.partitionTime !== undefined ? date.toISOString(form.partitionTime) : undefined,
        orderTime: form.orderTime !== undefined ? datetime.toISOString(form.orderTime) : undefined
    }
}

function mapFromIllustFilter(data: IllustFilter) {
    return {
        ...data,
        partition: data.partition && date.toISOString(data.partition)
    }
}

/**
 * 图库项目。
 */
export interface IllustEndpoint {
    /**
     * 查询图库项目列表。
     */
    list(filter: IllustFilter): Promise<Response<ListResult<Illust>>>
    /**
     * collection类型的项的操作API。collection是image的集合，不能为空，空集合会自动删除。每个image只能从属一个集合。
     */
    collection: {
        /**
         * 创建一个新的collection。
         * @exception PARAM_ERROR ("score") score超出范围
         * @exception PARAM_REQUIRED ("images") images未提供
         * @exception RESOURCE_NOT_EXIST ("images", id: number[]) image id不存在或者可能是collection，总之不能用
         */
        create(form: CollectionCreateForm): Promise<Response<IdResponse, ResourceNotExist<"images", number[]>>>
        /**
         * 查看collection的元数据。
         * @exception NOT_FOUND
         */
        get(id: number): Promise<Response<DetailIllust, NotFound>>
        /**
         * 更改collection的元数据。
         * @exception NOT_FOUND
         * @exception PARAM_ERROR ("score") score超出范围
         * @exception NOT_EXIST ("tags"|"topics"|"authors", number[]) 选择的关联资源并不存在
         * @exception NOT_SUITABLE ("tags", number[]) 选择的资源不适用。tag: 不能选择addr类型的tag
         * @exception CONFLICTING_GROUP_MEMBERS ({[id: number]: {memberId: number, member: string}[]}) 违反tag冲突组约束。参数值是每一项冲突组的tagId，以及这个组下有冲突的tag的id和name列表
         */
        update(id: number, form: CollectionUpdateForm): Promise<Response<null, IllustExceptions["collection.update"]>>
        /**
         * 删除collection。
         * @exception NOT_FOUND
         */
        delete(id: number): Promise<Response<null, NotFound>>
        /**
         * collection的关联内容。只有关联组。
         */
        relatedItems: {
            /**
             * 查看关联内容。
             * @exception NOT_FOUND
             */
            get(id: number, filter: LimitFilter): Promise<Response<CollectionRelatedItems, NotFound>>
            /**
             * 更改关联内容。
             * @exception NOT_FOUND
             * @exception RESOURCE_NOT_EXIST ("associateId", id: number) 目标关联组不存在
             */
            update(id: number, form: CollectionRelatedUpdateForm): Promise<Response<null, IllustExceptions["collection.relatedItems.update"]>>
        }
        /**
         * collection的下属image。
         */
        images: {
            /**
             * 查询下属images。
             */
            get(id: number, filter: LimitAndOffsetFilter): Promise<Response<ListResult<Illust>, NotFound>>
            /**
             * 更改下属images。
             * @exception PARAM_REQUIRED ("images") images未提供
             * @exception RESOURCE_NOT_EXIST ("images", id: number[]) image id不存在或者可能是collection，总之不能用
             */
            update(id: number, imageIds: number[]): Promise<Response<null, IllustExceptions["collection.images.update"]>>
        }
    }
    /**
     * image类型的项的操作API。
     */
    image: {
        /**
         * 查看image的元数据。
         * @exception NOT_FOUND
         */
        get(id: number): Promise<Response<DetailIllust, NotFound>>
        /**
         * 更改image的元数据。
         * @exception NOT_FOUND
         * @exception PARAM_ERROR ("score") score超出范围
         * @exception NOT_EXIST ("tags"|"topics"|"authors", number[]) 选择的关联资源并不存在
         * @exception NOT_SUITABLE ("tags", number[]) 选择的资源不适用。tag: 不能选择addr类型的tag
         * @exception CONFLICTING_GROUP_MEMBERS ({[id: number]: {memberId: number, member: string}[]}) 违反tag冲突组约束。参数值是每一项冲突组的tagId，以及这个组下有冲突的tag的id和name列表
         */
        update(id: number, form: ImageUpdateForm): Promise<Response<null, IllustExceptions["image.update"]>>
        /**
         * 删除image。
         * @exception NOT_FOUND
         */
        delete(id: number): Promise<Response<null, NotFound>>
        /**
         * image的关联内容。包括关联组、所属画集、所属集合。
         */
        relatedItems: {
            /**
             * 查看关联内容。
             * @exception NOT_FOUND
             */
            get(id: number, filter: LimitFilter): Promise<Response<ImageRelatedItems, NotFound>>
            /**
             * 更改关联内容。
             * @exception NOT_FOUND
             * @exception RESOURCE_NOT_EXIST ("associateId"|"collectionId", id: number) 目标关联组/集合不存在
             */
            update(id: number, form: ImageRelatedUpdateForm): Promise<Response<null, IllustExceptions["image.relatedItems.update"]>>
        }
        /**
         * image的来源数据。包括关联的来源数据的id，以及关联到的来源数据内容。
         */
        originData: {
            /**
             * 查看来源数据。
             * @exception NOT_FOUND
             */
            get(id: number): Promise<Response<ImageOriginData, NotFound>>
            /**
             * 更改来源数据。
             * @exception NOT_FOUND
             * @exception NOT_EXIST ("source", source) 此source不存在
             * @exception PARAM_ERROR ("sourceId"/"sourcePart") 参数值错误，需要为自然数
             * @exception PARAM_REQUIRED ("sourceId"/"sourcePart") 需要这些参数
             * @exception PARAM_NOT_REQUIRED ("sourcePart"/"sourceId/sourcePart") 不需要这些参数
             */
            update(id: number, form: ImageOriginUpdateForm): Promise<Response<null, IllustExceptions["image.originData.update"]>>
        }
        fileInfo: {
            /**
             * 查看文件信息。
             * @exception NOT_FOUND
             */
            get(id: number): Promise<Response<ImageFileInfo, NotFound>>
        }
    }
    /**
     * 关联组的操作API。关联组是illust的集合，不能为空，空集合会自动删除。每个illust只能枞树一个关联组。
     */
    associates: {
        /**
         * 使用给定的illust列表，创建新的关联组。
         * @exception PARAM_ERROR ("illusts") illust列表不能为空
         */
        create(illustIds: number[]): Promise<Response<IdResponse>>
        /**
         * 查询一个关联组的内容列表。
         * @exception NOT_FOUND
         */
        get(id: number, filter: LimitAndOffsetFilter): Promise<Response<ListResult<Illust>, NotFound>>
        /**
         * 更换关联组的内容列表。
         * @exception NOT_FOUND
         * @exception PARAM_ERROR ("illusts") illust列表不能为空
         */
        update(id: number, illustIds: number[]): Promise<Response<null, NotFound>>
        /**
         * 删除一个关联组。
         */
        delete(id: number): Promise<Response<null>>
    }
}

export interface IllustExceptions {
    "collection.update": NotFound | ResourceNotExist<"topics" | "authors" | "tags", number[]> | ResourceNotSuitable<"tags", number[]> | ConflictingGroupMembersError
    "collection.relatedItems.update": NotFound | ResourceNotExist<"associateId", number>
    "collection.images.update": NotFound | ResourceNotExist<"images", number[]>
    "image.update": NotFound | ResourceNotExist<"topics" | "authors" | "tags", number[]> | ResourceNotSuitable<"tags", number[]> | ConflictingGroupMembersError
    "image.relatedItems.update": NotFound | ResourceNotExist<"collectionId" | "associateId", number>
    "image.originData.update": NotFound | ResourceNotExist<"source", string> | ParamNotRequired | ParamRequired | ParamError
}

export type IllustType = "COLLECTION" | "IMAGE"

export type Tagme = "TAG" | "AUTHOR" | "TOPIC" | "SOURCE"

interface IllustPublicPart {
    /**
     * illust id。
     */
    id: number
    /**
     * 此项目的文件路径。
     */
    file: string
    /**
     * 此项目的缩略图文件路径。缩略图有不存在的理论可能(未生成)，此时值为null，应该填充占位图像。
     */
    thumbnailFile: string
    /**
     * 此项目的评分。可能由手写评分或父子项目导出。
     */
    score: number | null
    /**
     * 是否收藏。
     */
    favorite: boolean
    /**
     * tagme标记。
     */
    tagme: Tagme[]
    /**
     * 此项目的排序时间。
     */
    orderTime: LocalDateTime
}

export interface Illust extends IllustPublicPart {
    /**
     * illust类型。
     */
    type: IllustType
    /**
     * 子项目的数量。只有类型为COLLECTION的项目会有子项目。
     */
    childrenCount: number | null
}

export interface DetailIllust extends IllustPublicPart {
    /**
     * 文件记录的id。
     */
    fileId: number
    /**
     * 主题。
     */
    topics: DepsTopic[]
    /**
     * 作者。
     */
    authors: DepsAuthor[]
    /**
     * 标签。
     */
    tags: DepsTag[]
    /**
     * 描述。可能由手写描述或父集合导出。
     */
    description: string
    /**
     * 手写的原始描述。
     */
    originDescription: string
    /**
     * 手写的原始评分。
     */
    originScore: number | null
    /**
     * 分区时间。
     */
    partitionTime: LocalDate
    /**
     * 创建时间。
     */
    createTime: LocalDateTime
    /**
     * 关联的图像上次发生更新的时间。
     */
    updateTime: LocalDateTime
}

export interface SimpleIllust {
    id: number
    thumbnailFile: string
}

export interface IllustParent extends SimpleIllust {
    childrenCount: number
}

export interface CollectionRelatedItems {
    /**
     * collection所属的关联组。
     */
    associate: Associate | null
}

export interface ImageFileInfo {
    file: string
    extension: string
    size: number
    thumbnailSize: number | null
    resolutionWidth: number
    resolutionHeight: number
    createTime: LocalDateTime
}

export interface ImageRelatedItems {
    /**
     * image所属的collection。
     */
    collection: IllustParent | null
    /**
     * image所属的画集列表。
     */
    albums: SimpleAlbum[]
    /**
     * image所属的关联组。
     */
    associate: Associate | null
}

export type ImageOriginData = {
    /**
     * source站点的name。
     */
    source: string
    /**
     * source站点的显示标题。当此站点没有标题时值为null。
     */
    sourceTitle: string | null
    /**
     * 此项目的source id。
     */
    sourceId: number
    /**
     * 此项目的secondary id。
     */
    sourcePart: number | null
    /**
     * 来源数据：标题。
     */
    title: string | null
    /**
     * 来源数据：描述。
     */
    description: string | null
    /**
     * 来源数据：标签。
     */
    tags: SourceTag[]
    /**
     * 来源数据：所属pool的标题列表。
     */
    pools: string[]
    /**
     * 来源数据：关联的children的id列表。
     */
    children: number[]
    /**
     * 来源数据：关联的parent的id列表。
     */
    parents: number[]
} | {
    source: null
    sourceTitle: null
    sourceId: null
    sourcePart: null
    title: null
    description: null
    tags: null
    pools: null
    children: null
    parents: null
}

export interface Associate {
    /**
     * 此关联组的id。
     */
    id: number
    /**
     * 此关联组的项目总数。
     */
    totalCount: number
    /**
     * 此关联组的项目列表。它会被filter所影响。
     */
    items: Illust[]
}

export interface CollectionCreateForm {
    images: number[]
    description?: string
    score?: number
    favorite?: boolean
    tagme?: Tagme[]
}

export interface CollectionUpdateForm {
    topics?: number[]
    authors?: number[]
    tags?: number[]
    description?: string | null
    score?: number | null
    favorite?: boolean
    tagme?: Tagme[]
}

export interface CollectionRelatedUpdateForm {
    associateId?: number
}

export interface ImageUpdateForm extends CollectionUpdateForm {
    partitionTime?: LocalDate
    orderTime?: LocalDateTime
}

export interface ImageRelatedUpdateForm extends CollectionRelatedUpdateForm {
    collectionId?: number | null
}

export interface ImageOriginUpdateForm {
    source?: string | null
    sourceId?: number | null
    sourcePart?: number | null
    title?: string | null
    description?: string | null
    tags?: SourceTag[]
    pools?: string[]
    children?: number[]
    parents?: number[]
}

export type IllustFilter = IllustQueryFilter & LimitAndOffsetFilter

export interface IllustQueryFilter {
    /**
     * 使用HQL进行查询。list API不提示解析结果，需要使用另外的API。
     */
    query?: string
    /**
     * 排序字段列表。优先使用来自HQL的排序。
     */
    order?: OrderList<"id" | "score" | "orderTime" | "createTime" | "updateTime">
    /**
     * 查询类型。IMAGE仅查询image类型；COLLECTION查询collection项以及非collection所属的项。
     */
    type: IllustType
    /**
     * 分区。
     */
    partition?: LocalDate
    /**
     * 收藏标记。
     */
    favorite?: boolean
    /**
     * 按topic id筛选。
     */
    topic?: number
    /**
     * 按author id筛选。
     */
    author?: number
}
