import { AuthorType } from "@/functions/adapter-http/impl/author"

export const AUTHOR_TYPE_ENUMS_WITHOUT_UNKNOWN: AuthorType[] = ["ARTIST", "STUDIO", "PUBLISH"]

export const AUTHOR_TYPE_ENUMS: AuthorType[] = ["UNKNOWN", ...AUTHOR_TYPE_ENUMS_WITHOUT_UNKNOWN]

export const AUTHOR_TYPE_ICONS: {[key in AuthorType]: string} = {
    "UNKNOWN": "question",
    "ARTIST": "paint-brush",
    "STUDIO": "swatchbook",
    "PUBLISH": "stamp"
}

export const AUTHOR_TYPE_NAMES: {[key in AuthorType]: string} = {
    "UNKNOWN": "未知类型",
    "ARTIST": "画师",
    "STUDIO": "工作室",
    "PUBLISH": "出版物"
}
