import { AnnotationTarget } from "@/functions/adapter-http/impl/annotations"
import { SelectItem } from "@/components/forms/Select"

export const TARGET_TYPE_ENUMS: AnnotationTarget[] = ["TAG", "TOPIC", "COPYRIGHT", "WORK", "CHARACTER", "AUTHOR", "ARTIST", "STUDIO", "PUBLISH"]

export const TARGET_TYPE_ICONS: {[key in AnnotationTarget]: string} = {
    "TAG": "tag",
    "TOPIC": "hashtag",
    "AUTHOR": "user-tag",
    "ARTIST": "paint-brush",
    "STUDIO": "swatchbook",
    "PUBLISH": "stamp",
    "COPYRIGHT": "copyright",
    "WORK": "bookmark",
    "CHARACTER": "user-ninja"
}

export const TARGET_TYPE_NAMES: {[key in AnnotationTarget]: string} = {
    "TAG": "标签",
    "TOPIC": "主题",
    "AUTHOR": "作者",
    "ARTIST": "画师",
    "STUDIO": "工作室",
    "PUBLISH": "出版物",
    "COPYRIGHT": "版权方",
    "WORK": "作品",
    "CHARACTER": "角色"
}

export const CAN_BE_EXPORTED_SELECT_ITEMS: SelectItem[] = [
    {name: "不可导出至图库项目", value: "false"},
    {name: "可导出至图库项目", value: "true"}
]
