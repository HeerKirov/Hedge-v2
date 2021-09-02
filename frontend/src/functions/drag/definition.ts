import { SimpleAuthor } from "@/functions/adapter-http/impl/author"
import { SimpleTopic } from "@/functions/adapter-http/impl/topic"
import { SimpleTag } from "@/functions/adapter-http/impl/tag"

export interface TypeDefinition {
    tag: SimpleTag
    topic: SimpleTopic
    author: SimpleAuthor
}
