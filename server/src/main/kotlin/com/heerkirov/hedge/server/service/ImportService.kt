package com.heerkirov.hedge.server.service

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.exceptions.FileNotFoundError
import com.heerkirov.hedge.server.form.*
import com.heerkirov.hedge.server.manager.FileManager
import com.heerkirov.hedge.server.manager.ImportManager
import com.heerkirov.hedge.server.manager.SourceImageManager
import com.heerkirov.hedge.server.utils.Fs
import com.heerkirov.hedge.server.utils.defer
import com.heerkirov.hedge.server.utils.deleteIt
import com.heerkirov.hedge.server.utils.types.ListResult
import java.io.File
import java.nio.file.Files
import java.nio.file.StandardCopyOption

class ImportService(private val data: DataRepository,
                    private val fileMgr: FileManager,
                    private val importMgr: ImportManager,
                    private val sourceImageMgr: SourceImageManager) {
    fun list(filter: ImportFilter): ListResult<ImportImageRes> {
        TODO()
    }

    fun import(form: ImportForm): Int = defer {
        val file = File(form.filepath).applyReturns {
            if(form.removeOriginFile) deleteIt()
        }
        if(!file.exists() || !file.canRead()) throw FileNotFoundError()

        val fileId = data.db.transaction { fileMgr.newFile(file) }.alsoExcept { fileId ->
            fileMgr.revertNewFile(fileId)
        }

        data.db.transaction {
            importMgr.create(fileId, sourceFile = file)
        }
    }

    fun upload(form: UploadForm): Int = defer {
        val file = Fs.temp(form.extension).applyDefer {
            deleteIt()
        }.also { file ->
            Files.copy(form.content, file.toPath(), StandardCopyOption.REPLACE_EXISTING)
        }

        val fileId = data.db.transaction { fileMgr.newFile(file) }.alsoExcept { fileId ->
            fileMgr.revertNewFile(fileId)
        }

        data.db.transaction {
            importMgr.create(fileId, sourceFilename = form.filename)
        }
    }

    fun get(id: Int): ImportImageDetailRes {
        TODO()
    }

    fun update(id: Int, form: ImportUpdateForm) {
        TODO()
    }

    fun delete(id: Int) {
        TODO()
    }

    fun findDuplicate(form: FindDuplicateForm): Any {
        TODO()
    }

    fun analyseSource(form: AnalyseSourceForm): Any {
        TODO()
    }

    fun generateTime(form: GenerateTimeForm): Any {
        TODO()
    }

    fun generateAction(form: GenerateActionForm): Any {
        TODO()
    }

    fun save() {
        TODO()
    }
}