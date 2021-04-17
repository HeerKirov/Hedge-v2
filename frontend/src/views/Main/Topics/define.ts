import { TopicType } from "@/functions/adapter-http/impl/topic"

export const TOPIC_TYPE_ENUMS: TopicType[] = ["UNKNOWN", "COPYRIGHT", "WORK", "CHARACTER"]

export const TOPIC_TYPE_ICONS: {[key in TopicType]: string} = {
    "UNKNOWN": "question",
    "COPYRIGHT": "copyright",
    "WORK": "bookmark",
    "CHARACTER": "user-ninja"
}

export const TOPIC_TYPE_NAMES: {[key in TopicType]: string} = {
    "UNKNOWN": "未知类型",
    "COPYRIGHT": "版权方",
    "WORK": "作品",
    "CHARACTER": "角色"
}
