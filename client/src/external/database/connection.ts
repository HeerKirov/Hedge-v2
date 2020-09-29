import path from "path"
import { Database as sqlite3Driver } from "sqlite3"
import * as sqlite from "sqlite"
import { DATABASE_DIM } from "../../definitions/file-dim"
import { exists, mkdir, readFile, writeFile } from "../../utils/fs"
import { Metadata } from "./model"

export interface Connection {
    getSchema(): Schema
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
    const db = await sqlite.open({filename: path.join(schema.path, DATABASE_DIM.MAIN_DB), driver: sqlite3Driver})
    //TODO 初始化数据结构
    return await build({schema, db})
}

export async function connectToConnection(filepath: string): Promise<Connection> {
    const metadata = await readFile<Metadata>(path.join(filepath, DATABASE_DIM.METADATA))
    if(metadata == null) {
        throw new Error(`File '${DATABASE_DIM.METADATA}' is not exists.`)
    }
    const schema = {
        path: filepath,
        name: metadata.name,
        description: metadata.description
    }

    const db = await sqlite.open({filename: path.join(filepath, DATABASE_DIM.MAIN_DB), driver: sqlite3Driver})
    //TODO 版本检查和同步
    return await build({schema, db})
}


async function build(context: {
    schema: Schema
    db: sqlite.Database
}): Promise<Connection> {
    const { schema, db } = context

    function getSchema() {
        return schema
    }

    async function close(): Promise<void> {
        await db.close()
    }

    return {
        getSchema,
        close
    }
}
