import { AnnotationTarget } from "@/functions/adapter-http/impl/annotations"

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