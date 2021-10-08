package com.heerkirov.hedge.server.model.system

import com.heerkirov.hedge.server.enums.MetaType

data class MeHistoryMeta(/**
                          * 根据类型隔离的序列ID。
                          */
                         val sequenceId: Long,
                         /**
                          * 目标元数据类型。
                          */
                         val metaType: MetaType,
                         /**
                          * 目标元数据ID。
                          */
                         val metaId: Int,
                         /**
                          * 记录时间。
                          */
                         val recordTime: Long)
