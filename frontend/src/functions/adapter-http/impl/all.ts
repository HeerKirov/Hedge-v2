import { SimpleTag } from "@/functions/adapter-http/impl/tag"
import { SimpleTopic } from "@/functions/adapter-http/impl/topic"
import { SimpleAuthor } from "@/functions/adapter-http/impl/author"

export { SimpleTopic, SimpleTag, SimpleAuthor }

export type MetaTagTypeValues = {type: "tag", value: SimpleTag} | {type: "topic", value: SimpleTopic} | {type: "author", value: SimpleAuthor}

export type MetaTagTypes = MetaTagTypeValues["type"]

export type MetaTagValues = MetaTagTypeValues["value"]
