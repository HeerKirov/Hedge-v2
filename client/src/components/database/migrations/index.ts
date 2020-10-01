import * as sqlite from "sqlite"
import { Migrate, migrate as migrateIt } from "../../../utils/migrations"
import { Metadata } from "../model"
import v0_1_0 from "./v0.1.0"

/**
 * 已注册的同步过程列表。
 */
const migrations: {[version: string]: Migrate<MigrateContext>} = {
    "0.1.0": v0_1_0
}

export interface MigrateContext {
    metadata: Metadata
    db: sqlite.Database
    openOtherDB(dbName: string): Promise<sqlite.Database>
}

export async function migrate(context: MigrateContext): Promise<MigrateContext & {changed: boolean}> {
    return await migrateIt(context, migrations, {
        set(context, v) {
            context.metadata.version = v
        },
        get(context) {
            return context.metadata.version
        }
    })
}
