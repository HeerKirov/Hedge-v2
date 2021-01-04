package com.heerkirov.hedge.server.model.source

import java.time.LocalDateTime

/**
 * 物理文件。
 * 此表的每条记录对应一个物理文件。对此表的ORM操作可封装为对物理文件的操作。
 *  - 记录对应的文件路径通过属性推出，为"${folder}/${id}.${extension}"。
 *  - 如果存在缩略图，缩略图路径为"${folder}/${id}.thumbnail.jpg"。缩略图只可能使用jpg格式。
 * 物理文件表为同步而设计。备份引擎会对物理文件表做筛选扫描，以在最小范围内确定需要备份的文件。
 *  - 通过update_time比对扫描得出需要更新的记录。
 *  - 比对记录的sync_records记录，根据这个记录对物理文件进行同步。
 */
data class FileRecord(val id: Int,
                      /**
                       * 所在文件夹名称<yyyy-MM-dd>，一般用其添加日期作为文件夹名称
                       */
                      val folder: String,
                      /**
                       * 文件扩展名，同时也表示此文件的类型。
                       */
                      val extension: String,
                      /**
                       * 是否存在缩略图。
                       */
                      val thumbnail: ThumbnailStatus,
                      /**
                       * 此文件占用的磁盘大小，单位Byte。
                       */
                      val size: Long,
                      /**
                       * 缩略图占用的磁盘大小，单位Byte。没有缩略图时记0。
                       */
                      val thumbnailSize: Long,
                      /**
                       * 文件是否处于删除状态。由于同步机制的需要，文件可以删除，记录不能删除。
                       */
                      val deleted: Boolean = false,
                      /**
                       * 该文件对象的同步记录。
                       */
                      val syncRecords: List<SyncRecord>,
                      /**
                       * 记录创建时间。
                       */
                      val createTime: LocalDateTime,
                      /**
                       * 同步记录上次更新的时间。
                       */
                      val updateTime: LocalDateTime) {
    /**
     * 对文件的任意操作都会留下记录。
     * 比如，导入一个新文件，并建立其缩略图时，记录可能为：
     * - action=create, filepath=yyyy-MM-dd/id.ext
     * - action=create, filepath=yyyy-MM/dd/id.thumbnail.jpg
     * 比如对文件做了格式转换时：
     * - action=delete, filepath=yyyy-MM-dd/id.png
     * - action=create, filepath=yyyy-MM-dd/id.jpg
     */
    data class SyncRecord(val action: SyncAction, val filepath: String)

    enum class SyncAction {
        CREATE, DELETE
    }

    enum class ThumbnailStatus {
        /**
         * 缩略图未生成。
         */
        NULL,
        /**
         * 缩略图存在。
         */
        YES,
        /**
         * 缩略图不存在，使用主图代替即可。
         */
        NO
    }
}