import { SimpleAuthor, SimpleTopic, SimpleTag } from "@/functions/adapter-http/impl/all"
import { SimpleAnnotation } from "@/functions/adapter-http/impl/annotations"
import { IllustType } from "@/functions/adapter-http/impl/illust"
import { ImportImage } from "@/functions/adapter-http/impl/import"

export interface TypeDefinition {
    tag: SimpleTag
    topic: SimpleTopic
    author: SimpleAuthor
    annotation: SimpleAnnotation
    illusts: DraggingIllust[]
    importImages: ImportImage[]
}

export interface DraggingIllust {
    id: number
    thumbnailFile: string
    type: IllustType
    childrenCount: number | null
}
