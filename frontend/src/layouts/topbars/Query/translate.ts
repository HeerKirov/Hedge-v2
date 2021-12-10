import { ElementGroup } from "@/functions/adapter-http/impl/util-query"

export const ELEMENT_TYPES: {[key in ElementGroup["type"]]: string} = {
    "name": "名称",
    "annotation": "注解",
    "meta-tag": "标签",
    "source-tag": "来源标签"
}

export const FIELD_NAMES: {[key: string]: string} = {
    "ID": "ID",
    "FAVORITE": "收藏",
    "ALBUM_MEMBER": "画集成员",
    "SCORE": "评分",
    "IMAGE_COUNT": "项目数量",
    "CREATE_TIME": "创建时间",
    "UPDATE_TIME": "上次修改",
    "ORDINAL": "排序时间",
    "PARTITION": "时间分区",
    "TITLE": "标题",
    "DESCRIPTION": "时间分区",
    "EXTENSION": "扩展名",
    "FILESIZE": "文件大小",
    "SOURCE": "来源",
    "SOURCE_ID": "来源ID",
    "SOURCE_FROM": "来源站点",
    "SOURCE_DESCRIPTION": "来源描述",
    "TAGME": "TAGME",
}
