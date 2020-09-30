import { MigrateContext } from "./index"
import { DATABASE_DIM } from "../../../definitions/file-dim"

export default async function(context: MigrateContext): Promise<void> {
    await migrateMainDB(context)
    await migrateOriDB(context)
}

async function migrateMainDB(context: MigrateContext) {
    const { db } = context

}

async function migrateOriDB(context: MigrateContext) {
    const db = await context.openOtherDB(DATABASE_DIM.ORIGIN_DB)

    await db.close()
}
