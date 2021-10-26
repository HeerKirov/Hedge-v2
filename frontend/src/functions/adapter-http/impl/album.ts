import { HttpInstance, Response } from ".."
import { ConflictingGroupMembersError, NotFound, ResourceNotExist, ResourceNotSuitable } from "../exception"
import { IdResponse, LimitAndOffsetFilter, ListResult, OrderList } from "./generic"
import { DepsTopic } from "./topic"
import { DepsAuthor } from "./author"
import { DepsTag } from "./tag"
import { Tagme } from "./illust"
import { datetime, LocalDateTime } from "@/utils/datetime"

export function createAlbumEndpoint(http: HttpInstance): AlbumEndpoint {
    return {
        list: http.createQueryRequest("/api/albums", "GET", {
            parseResponse: ({ total, result }: ListResult<any>) => ({total, result: result.map(mapToAlbum)})
        }),
        create: http.createDataRequest("/api/albums", "POST"),
        get: http.createPathRequest(id => `/api/albums/${id}`, "GET", {
            parseResponse: mapToDetailAlbum
        }),
        update: http.createPathDataRequest(id => `/api/albums/${id}`, "PATCH"),
        delete: http.createPathRequest(id => `/api/albums/${id}`, "DELETE"),
        images: {
            get: http.createPathQueryRequest(id => `/api/albums/${id}/images`, "GET", {
                parseResponse: ({ total, result }: ListResult<any>) => ({total, result: result.map(mapToAlbumImage)})
            }),
            update: http.createPathDataRequest(id => `/api/albums/${id}/images`, "PUT"),
            partialUpdate: http.createPathDataRequest(id => `/api/albums/${id}/images`, "PATCH")
        }
    }
}

function mapToAlbum(data: any): Album {
    return {
        id: <number>data["id"],
        title: <string>data["title"],
        imageCount: <number>data["imageCount"],
        file: <string | null>data["file"],
        thumbnailFile: <string | null>data["thumbnailFile"],
        score: <number | null>data["score"],
        favorite: <boolean>data["favorite"],
        createTime: datetime.of(<string>data["createTime"]),
        updateTime: datetime.of(<string>data["updateTime"])
    }
}

function mapToDetailAlbum(data: any): DetailAlbum {
    return {
        ...mapToAlbum(data),
        topics: <DepsTopic[]>data["topics"],
        authors: <DepsAuthor[]>data["authors"],
        tags: <DepsTag[]>data["tags"],
        description: <string>data["description"]
    }
}

function mapToAlbumImage(data: any): AlbumImage {
    return {
        id: <number>data["id"],
        file: <string>data["file"],
        thumbnailFile: <string>data["thumbnailFile"],
        score: <number | null>data["score"],
        favorite: <boolean>data["favorite"],
        tagme: <Tagme[]>data["tagme"],
        orderTime: datetime.of(<string>data["orderTime"])
    }
}

export interface AlbumEndpoint {
    /**
     * 查询画集列表。
     */
    list(filter: AlbumFilter): Promise<Response<ListResult<Album>>>
    /**
     * 创建新的画集。
     * @throws NOT_EXIST ("images", number[]) 图库项目不存在。
     */
    create(form: AlbumCreateForm): Promise<Response<IdResponse, AlbumExceptions["create"]>>
    /**
     * 查看画集。
     * @param albumId
     */
    get(albumId: number): Promise<Response<DetailAlbum, NotFound>>
    /**
     * 修改画集的元数据。
     * @throws ResourceNotExist ("topics" | "authors" |"tags", number[])
     * @throws ResourceNotSuitable ("tags", number[])
     * @throws ConflictingGroupMembersError
     */
    update(albumId: number, form: AlbumUpdateForm): Promise<Response<null, AlbumExceptions["update"]>>
    /**
     * 删除画集。
     */
    delete(albumId: number): Promise<Response<null, NotFound>>
    images: {
        /**
         * 查询下属images。
         */
        get(albumId: number, filter: LimitAndOffsetFilter): Promise<Response<ListResult<AlbumImage>>>
        /**
         * 全量修改images列表。
         */
        update(albumId: number, items: number[]): Promise<Response<null, AlbumExceptions["images.update"]>>
        /**
         * 部分修改images列表。
         * @param albumId
         * @param form
         */
        partialUpdate(albumId: number, form: AlbumImagesPartialUpdateForm): Promise<Response<null, AlbumExceptions["images.partialUpdate"]>>
    }
}

export interface AlbumExceptions {
    "create": ResourceNotExist<"images", number[]>,
    "update": NotFound | ResourceNotExist<"topics" | "authors" | "tags", number[]> | ResourceNotSuitable<"tags", number[]> | ConflictingGroupMembersError
    "images.update": NotFound | ResourceNotExist<"images", number[]>
    "images.partialUpdate": NotFound | ResourceNotExist<"images" | "itemIndexes", number[]>
}

export interface SimpleAlbum {
    id: number
    title: string
}

export interface Album {
    /**
     * album id.
     */
    id: number
    /**
     * album标题。
     */
    title: string
    /**
     * album下含有的image数量。
     */
    imageCount: number
    /**
     * 作为album封面的image文件路径。如果album没有项目，那么文件路径是null。
     */
    file: string | null
    /**
     * 作为album封面的image缩略图文件路径。如果album没有项目，那么文件路径是null。
     */
    thumbnailFile: string | null
    /**
     * 评分。
     */
    score: number | null
    /**
     * 是否收藏。
     */
    favorite: boolean
    /**
     * 此画集的创建时间。
     */
    createTime: LocalDateTime
    /**
     * 此画集上次更改内含项目的时间。
     */
    updateTime: LocalDateTime
}

export interface DetailAlbum extends Album {
    /**
     * topic元数据。
     */
    topics: DepsTopic[]
    /**
     * author元数据。
     */
    authors: DepsAuthor[]
    /**
     * tag元数据。
     */
    tags: DepsTag[]
    /**
     * 描述。
     */
    description: string
}

export interface AlbumImage {
    id: number
    file: string
    thumbnailFile: string
    score: number | null
    favorite: boolean
    tagme: Tagme[]
    orderTime: LocalDateTime
}

export interface AlbumCreateForm {
    title?: string | null
    description?: string | null
    images: number[]
    score?: number | null
    favorite?: boolean
}

export interface AlbumUpdateForm {
    title?: string | null
    description?: string | null
    score?: number | null
    favorite?: boolean
    topics?: number[]
    authors?: number[]
    tags?: number[]
}

export type AlbumImagesPartialUpdateForm = {
    /**
     * 添加新项目。
     */
    action: "ADD"
    /**
     * 新添加的image id。
     */
    images: number[]
    /**
     * 插入位置。不填默认放在末尾。
     */
    ordinal?: number
} | {
    /**
     * 移动现有项目的位置。
     */
    action: "MOVE"
    /**
     * 选取的项目的index。
     */
    itemIndexes: number[]
    /**
     * 放置的新位置。放置位置的判定是将要移动的项目全部移除后，再判定插入位置。
     */
    ordinal: number
} | {
    /**
     * 移除现有项目。
     */
    action: "DELETE"
    /**
     * 要移除的项目的index。
     */
    itemIndexes: number[]
}

export type AlbumFilter = AlbumQueryFilter & LimitAndOffsetFilter

export interface AlbumQueryFilter {
    query?: string
    order?: OrderList<"id" | "score" | "createTime" | "updateTime">
    favorite?: boolean
}
