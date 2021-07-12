package com.heerkirov.hedge.server.model.source

import java.time.LocalDateTime

/**
 * 物理文件。
 * 此表的每条记录对应一个物理文件。对此表的ORM操作可封装为对物理文件的操作。
 *  - 记录对应的文件路径通过属性推出，为"${folder}/${id}.${extension}"。
 *  - 如果存在缩略图，缩略图路径为"${folder}/${id}.thumbnail.jpg"。缩略图只可能使用jpg格式。
 * 物理文件导入后需要经过后台任务的处理，以生成缩略图和其他详细信息。这个状态保存在status中。
 */
data class FileRecord(val id: Int,
                      /**
                       * 所在文件夹名称<yyyy-MM-dd>，一般用其添加日期作为文件夹名称。
                       */
                      val folder: String,
                      /**
                       * 文件扩展名，同时也表示此文件的类型。
                       */
                      val extension: String,
                      /**
                       * 此文件占用的磁盘大小，单位Byte。
                       */
                      val size: Long,
                      /**
                       * 缩略图占用的磁盘大小，单位Byte。没有缩略图时记0。
                       */
                      val thumbnailSize: Long,
                      /**
                       * 分辨率的宽度值。未填写时记0。
                       */
                      val resolutionWidth: Int,
                      /**
                       * 分辨率的高度值。未填写时记0。
                       */
                      val resolutionHeight: Int,
                      /**
                       * 文件的处理与可用状态。
                       */
                      val status: FileStatus,
                      /**
                       * 文件是否处于删除状态。删除状态的文件仍可以在文件管理的废纸篓中看到。
                       * 删除illust会使失去引用的文件进入删除状态。
                       */
                      val deleted: Boolean = false,
                      /**
                       * 记录创建时间。
                       */
                      val createTime: LocalDateTime,
                      /**
                       * 上次更新物理文件的时间。
                       */
                      val updateTime: LocalDateTime) {

    enum class FileStatus {
        /**
         * 文件未准备完成。
         */
        NOT_READY,

        /**
         * 文件已准备完成，已生成缩略图和其他信息。
         */
        READY,

        /**
         * 文件已准备完成，已生成其他信息，但不需要且没有生成缩略图。
         */
        READY_WITHOUT_THUMBNAIL
    }
}