
export function argvContains(argv: string[], flag: string): boolean {
    return argv.find(v => v === flag) != undefined
}

export function argvGet(argv: string[], param: string, defaultValue?: string): string {
    const index = argv.findIndex(v => v === param)
    const value = index >= 0 ? argv[index + 1] : undefined
    return value ?? defaultValue ?? (() => { throw new Error(`Param '${param}' is required.`) })()
}
