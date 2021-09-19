import { SimpleAuthor, SimpleTopic, SimpleTag } from "@/functions/adapter-http/impl/all"
import { SimpleAnnotation } from "@/functions/adapter-http/impl/annotations"

export interface TypeDefinition {
    tag: SimpleTag
    topic: SimpleTopic
    author: SimpleAuthor
    annotation: SimpleAnnotation
}
