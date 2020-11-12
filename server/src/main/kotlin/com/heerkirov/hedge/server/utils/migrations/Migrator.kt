package com.heerkirov.hedge.server.utils.migrations

import com.heerkirov.hedge.server.utils.Fs
import java.io.Closeable

/**
 * 给定基础版本号。随后调用migrate方法对指定内容进行升级，基于基础版本号，并总结出升级完成后的最终版本号。
 * migrate过程中，将策略的migrations列表与baseVersion进行比对。
 * 存在大于当前version的migration时，执行同步流程。
 * 不存在时，执行直接转换流程。
 * 如果源数据不存在，且策略符合create final策略，将直接创建数据不经过migration。
 */
open class Migrator(val baseVersion: Version) {
    var maxVersion: Version = baseVersion
        private set

    /**
     * 使用给定策略升级源数据。
     * @return 输出升级后的数据，并给出一个标记，是否存在任何更改。
     */
    fun <IN, MID, OUT> migrate(source: IN, strategy: Strategy<IN, MID, OUT>): Result<OUT> {
        val migrations = MigrationRegister<MID>().also { strategy.migrations(it) }.build()
        if(migrations.isEmpty()) { throw IllegalArgumentException("Migrations list is empty.") }

        if(strategy is CreateFinalDataStrategy) {
            val optional = strategy.createFinalData(source)
            if(optional.isPresent) {
                //create final策略返回了有效值，因此直接返回此数据
                return Result(optional.get(), true)
            }
        }
        return if(migrations.last().first <= baseVersion) {
            //版本号不大于时不需要同步
            Result(strategy.translateSourceToOutputType(source), false)
        }else{
            //最后一位的版本号大于当前版本号即可以证明需要同步
            if(migrations.last().first > maxVersion) { maxVersion = migrations.last().first }

            var temp = strategy.translateSourceToTempType(source)

            for ((_, action) in migrations.asSequence().filter { (v, _) -> v > baseVersion }) {
                temp = action(temp)
            }

            Result(strategy.translateTempToOutputType(temp), true)
        }
    }

    data class Result<OUT>(val data: OUT, val changed: Boolean)
}

class VersionFileMigrator(private val path: String) : Closeable {
    private val migrator: Migrator = Migrator(Fs.readText(path)?.let { versionOf(it) } ?: Version(0, 0, 0))

    fun <IN, MID, OUT> migrate(source: IN, strategy: Strategy<IN, MID, OUT>): Migrator.Result<OUT> = migrator.migrate(source, strategy)

    override fun close() {
        if(migrator.maxVersion > migrator.baseVersion) {
            Fs.writeText(path, migrator.maxVersion.toString())
        }
    }
}