package com.heerkirov.hedge.server.model

/**
 * 可导出的注解与illust的关联。
 */
data class IllustAnnotationRelation(val illustId: Int, val annotationId: Int, /** 标记此注解从哪类标签导出来的。*/val exportedFrom: Annotation.ExportedFrom)