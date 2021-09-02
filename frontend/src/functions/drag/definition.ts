import { AuthorType } from "@/functions/adapter-http/impl/author"
import { TopicType } from "@/functions/adapter-http/impl/topic"

export interface TypeDefinition {
    tag: StandardTag
    topic: StandardTopic
    author: StandardAuthor
}

interface StandardTag {
    id: number
    name: string
    color: string | null
}

interface StandardAuthor {
    id: number
    name: string
    type: AuthorType
    color: string | null
}

interface StandardTopic {
    id: number
    name: string
    type: TopicType
    color: string | null
}
