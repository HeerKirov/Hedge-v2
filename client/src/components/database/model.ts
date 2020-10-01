export interface Metadata {
    name: string
    description: string | null
    version: string
}

export function defaultValue(context: {name: string, description: string | null}): Metadata {
    return {
        name: context.name,
        description: context.description,
        version: "0.0.0"
    }
}
