package com.heerkirov.hedge.server.form

import com.heerkirov.hedge.server.library.form.*
import com.heerkirov.hedge.server.model.meta.Annotation
import com.heerkirov.hedge.server.utils.types.Opt
import com.heerkirov.hedge.server.utils.types.OrderItem

data class AnnotationRes(val id: Int, val name: String, val canBeExported: Boolean, val target: Annotation.AnnotationTarget)

data class AnnotationFilter(@Limit val limit: Int,
                            @Offset val offset: Int,
                            @Search val search: String?,
                            @Order(options = ["id", "name", "createTime"])
                            val order: List<OrderItem>? = null,
                            val canBeExported: Boolean? = null,
                            val target: Annotation.AnnotationTarget? = null)

data class AnnotationCreateForm(@NotBlank val name: String, val canBeExported: Boolean, val target: Annotation.AnnotationTarget = Annotation.AnnotationTarget.EMPTY)

data class AnnotationUpdateForm(@NotBlank val name: Opt<String>, val canBeExported: Opt<Boolean>, val target: Opt<Annotation.AnnotationTarget>)

fun newAnnotationRes(it: Annotation) = AnnotationRes(it.id, it.name, it.canBeExported, it.target)