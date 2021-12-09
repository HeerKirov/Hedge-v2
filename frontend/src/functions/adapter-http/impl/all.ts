import { SimpleTag } from "./tag"
import { SimpleTopic } from "./topic"
import { SimpleAuthor } from "./author"

export { SimpleTopic, SimpleTag, SimpleAuthor }

export type MetaTagTypeValues = {type: "tag", value: SimpleTag} | {type: "topic", value: SimpleTopic} | {type: "author", value: SimpleAuthor}

export type MetaTagTypes = MetaTagTypeValues["type"]

export type MetaTagValues = MetaTagTypeValues["value"]
