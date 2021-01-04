package com.heerkirov.hedge.server.model.source

import com.heerkirov.hedge.server.model.illust.Illust
import java.time.LocalDate
import java.time.LocalDateTime

/**
 * 导入表。
 * 在二阶导入逻辑中，用于存储第一阶导入的图像的信息。
 * 在后续的逻辑中，删除导入记录，并转换为illust记录。
 */
data class ImportImage(val id: Int,
                       /**
                        * 关联的文件id。
                        */
                       val fileId: Int,
                       /**
                        * 原文件名，包括扩展名，不包括文件路径。
                        * 从web导入时可能没有，此时填null。
                        * (一级文件信息，主要是从文件直接取得的原始文件信息，用于配合策略生成后续的二级文件信息。)
                        */
                       val fileName: String?,
                       /**
                        * 原文件路径，不包括文件名。
                        * 从web导入时可能没有，此时填null。
                        * (一级文件信息，主要是从文件直接取得的原始文件信息，用于配合策略生成后续的二级文件信息。)
                        */
                       val filePath: String?,
                       /**
                        * 原文件创建时间。
                        * 从web导入时可能没有，此时填null。
                        * (一级文件信息，主要是从文件直接取得的原始文件信息，用于配合策略生成后续的二级文件信息。)
                        */
                       val fileCreateTime: LocalDateTime?,
                       /**
                        * 原文件修改时间。
                        * 从web导入时可能没有，此时填null。
                        * (一级文件信息，主要是从文件直接取得的原始文件信息，用于配合策略生成后续的二级文件信息。)
                        */
                       val fileUpdateTime: LocalDateTime?,
                       /**
                        * 一阶导入此文件的时间。
                        * (一级文件信息，主要是从文件直接取得的原始文件信息，用于配合策略生成后续的二级文件信息。)
                        */
                       val fileImportTime: LocalDateTime,
                       /**
                        * 原文件的来源信息。
                        * 对于macOS，使用xattr获得。
                        * (一级文件信息，主要是从文件直接取得的原始文件信息，用于配合策略生成后续的二级文件信息。)
                        */
                       val fileFromSource: List<String>?,
                       /**
                        * 标记为tagme。
                        * 可以通过配置决定要不要给项目加初始tagme，以及该加哪些。
                        * (二级文件信息，经过处理后导出，或填写的，属于基础元信息的部分。)
                        */
                       val tagme: Illust.Tagme,
                       /**
                        * 来源网站的代号。
                        * (二级文件信息，经过处理后导出，或填写的，属于基础元信息的部分。)
                        */
                       val source: String?,
                       /**
                        * 来源网站中的图像id。
                        * (二级文件信息，经过处理后导出，或填写的，属于基础元信息的部分。)
                        */
                       val sourceId: Long?,
                       /**
                        * 来源网站中的二级图像id。来源网站没有这个信息时，写null。
                        * (二级文件信息，经过处理后导出，或填写的，属于基础元信息的部分。)
                        */
                       val sourcePart: Int?,
                       /**
                        * 用于日历分组的时间。
                        */
                       val partitionTime: LocalDate,
                       /**
                        * 用于排序的时间。
                        */
                       val orderTime: Long,
                       /**
                        * 初次创建的时间。
                        */
                       val createTime: LocalDateTime)