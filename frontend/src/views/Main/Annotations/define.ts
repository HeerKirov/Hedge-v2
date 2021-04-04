import { AnnotationTarget } from "@/functions/adapter-http/impl/annotations"
import { SelectItem } from "@/components/Select";

export const TARGET_TYPE_ICON: {[key in AnnotationTarget]: string} = {
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

export const CAN_BE_EXPORTED_SELECT_ITEMS: SelectItem[] = [
    {name: "不可导出至图库项目", value: "false"},
    {name: "可导出至图库项目", value: "true"}
]