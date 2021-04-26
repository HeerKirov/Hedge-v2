export interface ConfigurationModel {
    dbPath: string
}

export interface Configuration {
    dbPath: DbPath
}

export interface DbPath {
    type: "absolute" | "channel"
    path: string
}