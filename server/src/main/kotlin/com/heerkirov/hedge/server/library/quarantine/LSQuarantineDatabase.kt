package com.heerkirov.hedge.server.library.quarantine

import com.heerkirov.hedge.server.utils.DateTime.toMillisecond
import com.heerkirov.hedge.server.utils.ktorm.HedgeDialect
import org.ktorm.database.Database
import org.ktorm.dsl.and
import org.ktorm.dsl.greaterEq
import org.ktorm.dsl.lessEq
import org.ktorm.entity.filter
import org.ktorm.entity.sequenceOf
import java.io.Closeable
import java.sql.Connection
import java.sql.DriverManager
import java.time.LocalDateTime
import java.util.regex.Pattern

class LSQuarantineDatabase(val path: String) : Closeable {
    private val conn: Connection = DriverManager.getConnection("jdbc:sqlite:$path")
    private val db: Database = Database.connect(dialect = HedgeDialect()) {
        object : Connection by conn {
            override fun close() { /* do nothing */ }
        }
    }

    override fun close() {
        conn.close()
    }

    fun findOriginURL(targetFilename: String, createTime: LocalDateTime): String? {
        val timestamp = createTime.toMillisecond() - baseTimestamp
        val records = db.sequenceOf(LSQuarantineEvents).filter { (it.timestamp greaterEq (timestamp - intervalTimestamp)) and (it.timestamp lessEq (timestamp + intervalTimestamp)) }
        for (record in records) {
            val filename = getFilenameInURL(record.dataURL)
            if(filename == targetFilename) {
                return record.originURL
            }
        }
        return null
    }

    private fun getFilenameInURL(url: String): String? {
        val matcher = urlPattern.matcher(url)
        if(matcher.find()) {
            return matcher.group(1)
        }
        return null
    }

    private val urlPattern = Pattern.compile("[a-zA-Z]+://[^?]+/([^?/]+)(\\?.*)?") //符合一般URL的结构，且其path的末段是文件名

    private val baseTimestamp = 978307200000 //2001-01-01T00:00:00Z，LSQuarantineEventTimestamp字段的时间戳从这个时间点开始，而不是1970-01-01T00:00:00Z

    private val intervalTimestamp = 1000 * 10 //时间戳的前后给出10s的不准确时长，在一定范围内搜索时间
}