import path from "path"
import * as sqlite from "sqlite"
import { Database as sqlite3Driver } from "sqlite3"
import { DATABASE_DIM } from "../../definitions/file-dim"
import { exists, mkdir, readFile, writeFile } from "../../utils/fs"
import { Metadata, defaultValue } from "./model"
import { migrate } from "./migrations"

export interface Connection {
    getPath(): string
    getMeta(): Metadata
    saveMeta(processData?: (m: Metadata) => void): Promise<Metadata>
    dsl(): sqlite.Database
    close(): Promise<void>
}

export interface Schema {
    path: string
    name: string
    description: string | null
}

export async function includeConnection(filepath: string): Promise<Schema> {
    //读取metadata文件，确保文件可用，随后返回从文件中读取的schema
    const metadata = await readFile<Metadata>(path.join(filepath, DATABASE_DIM.METADATA))
    if(metadata == null) {
        throw new Error(`File '${DATABASE_DIM.METADATA}' is not exists.`)
    }
    return {
        path: filepath,
        name: metadata.name,
        description: metadata.description
    }
}

export async function createConnection(schema: Schema): Promise<Connection> {
    //确认文件夹不存在
    if(exists(schema.path)) {
        throw new Error(`Folder '${schema.path}' is already exists.`)
    }
    await mkdir(schema.path)

    const metadata = defaultValue({name: schema.name, description: schema.description})

    return await build({filepath: schema.path, metadata})
}

export async function connectToConnection(filepath: string): Promise<Connection> {
    const metadata = await readFile<Metadata>(path.join(filepath, DATABASE_DIM.METADATA))
    if(metadata == null) {
        throw new Error(`File '${DATABASE_DIM.METADATA}' is not exists.`)
    }

    return await build({filepath, metadata})
}

async function build(context: {
    filepath: string,
    metadata: Metadata
}): Promise<Connection> {
    const { metadata, db, changed } = await migrate({
        metadata: context.metadata,
        db: await sqlite.open({filename: path.join(context.filepath, DATABASE_DIM.MAIN_DB), driver: sqlite3Driver}),
        async openOtherDB(dbName) {
            return await sqlite.open({filename: path.join(context.filepath, dbName), driver: sqlite3Driver})
        }
    })
    if(changed) {
        await writeFile(path.join(context.filepath, DATABASE_DIM.METADATA), metadata)
    }

    await db.run("ATTACH DATABASE ? AS ?", [path.join(context.filepath, DATABASE_DIM.ORIGIN_DB), "ori"])

    return await use({filepath: context.filepath, metadata, db})
}

async function use(context: {
    filepath: string,
    metadata: Metadata,
    db: sqlite.Database
}): Promise<Connection> {
    const { filepath, metadata, db } = context

    function getPath() {
        return filepath
    }

    function getMeta() {
        return metadata
    }

    async function saveMeta(processData?: (m: Metadata) => void) {
        if(typeof processData === 'function') {
            processData(metadata)
        }
        return await writeFile(path.join(context.filepath, DATABASE_DIM.METADATA), metadata)
    }

    function dsl() {
        return db
    }

    async function close() {
        await db.close()
    }

    return {
        getPath,
        getMeta,
        saveMeta,
        dsl,
        close
    }
}
