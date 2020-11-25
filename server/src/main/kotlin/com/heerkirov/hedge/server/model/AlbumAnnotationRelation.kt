package com.heerkirov.hedge.server.model

/**
 * 可导出的注解与album的关联。
 */
data class AlbumAnnotationRelation(val albumId: Int, val annotationId: Int, /** 标记此注解从哪类标签导出来的。*/val exportedFrom: Annotation.ExportedFrom)