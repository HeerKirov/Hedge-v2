package com.heerkirov.hedge.server.components.manager

import com.heerkirov.hedge.server.components.database.DataRepository

class ImportMetaManager(private val data: DataRepository) {
    /**
     * 对一条import记录的内容进行解析，得到source元数据。
     */
    fun analyseSourceMeta(filename: String?, filepath: String?, fromSource: List<String>): Triple<String, Long?, Int?> {
        TODO()
    }
}