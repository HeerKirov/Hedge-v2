package com.heerkirov.hedge.server.model

import java.time.LocalDateTime

/**
 * 文件夹。
 */
data class Folder(val id: Int,
                  /**
                   * 标题。
                   */
                  val title: String,
                  /**
                   * 虚拟查询表达式。此项不为NULL时，文件夹为虚拟文件夹。
                   */
                  val query: String?,
                  /**
                   * pin标记及其排序顺位。pin指将文件夹pin在侧边栏上永久显示。没有pin时填null。
                   */
                  val pin: Int?,
                  /**
                   * [cache field]文件夹包含的图片数量，仅对非虚拟文件夹有效。
                   */
                  val cachedCount: Int = 0,
                  /**
                   * 文件夹创建时间。
                   */
                  val createTime: LocalDateTime,
                  /**
                   * 文件夹中的项的更改时间/query查询表达式的更改时间。
                   */
                  val updateTime: LocalDateTime)