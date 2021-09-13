import { SimpleAuthor, SimpleTopic, SimpleTag } from "@/functions/adapter-http/impl/all"

export interface TypeDefinition {
    tag: SimpleTag
    topic: SimpleTopic
    author: SimpleAuthor
}
