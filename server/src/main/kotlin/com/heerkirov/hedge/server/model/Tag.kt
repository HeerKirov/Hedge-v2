package com.heerkirov.hedge.server.model

/**
 * 内容标签。
 */
data class Tag(val id: Int,
               /**
                * 排序下标，由系统维护，同一父标签一组从0开始。
                */
               val ordinal: Int,
               /**
                * 父标签的id。
                */
               val parentId: Int?,
               /**
                * 标签名。
                */
               val name: String,
               /**
                * 其他名称。
                */
               val otherNames: List<String>,
               /**
                * 标签类型。
                */
               val type: Type,
               /**
                * 组功能标记。
                * 组标记使一个地址段/标签的直接子节点被视作组员，建议只出现最多其一(添加二级子节点会推导出直接子节点，因此同样有效)。
                */
               val isGroup: IsGroup,
               /**
                * 描述。
                */
               val description: String,
               /**
                * 标签的颜色名称。
                */
               val color: String?,
               /**
                * 链接到其他标签。给出tag id列表。
                * 引入此标签时，链接到的其他标签会像此标签的父标签一样被导出。
                */
               val links: List<Int>?,
               /**
                * 标签的样例image。给出image id列表。
                */
               val examples: List<Int>?,
               /**
                * [exported field]关联的image的平均分。
                */
               val exportedScore: Int? = null,
               /**
                * [cache field]关联的image总数。仅包括image。
                */
               val cachedCount: Int = 0) {

    enum class Type {
        /**
         * 普通标签。
         */
        TAG,
        /**
         * 地址段。地址段不允许作为标签被引用，也不会出现在标签列表，但可以查询。
         */
        ADDR,
        /**
         * 虚拟地址段不会使用索引优化，因此查询效率有所损失，主要用于不需要索引的、用于分类归纳的地址段。
         */
        VIRTUAL_ADDR
    }

    enum class IsGroup {
        /**
         * 默认不开启。
         */
        NO,
        /**
         * 开启组标记。
         */
        YES,
        /**
         * 强制组：使建议升级为强制。但对推导无效。
         */
        FORCE,
        /**
         * 序列化组：使组员的ordinal排序具有实际意义，可以使用比较查询来查询组员。
         */
        SEQUENCE,
        /**
         * 强制+序列化组。
         */
        FORCE_AND_SEQUENCE
    }
}