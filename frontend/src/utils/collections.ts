export const arrays = {
    newArray<T>(length: number, generator: (index: number) => T): T[] {
        return Array(length).fill(null).map((_, index) => generator(index))
    }
}

export const maps = {
    filter<T>(map: {[key: string]: T}, condition: (key: string, value: T) => boolean): {[key: string]: T} {
        const ret: {[key: string]: T} = {}
        for(const [key, value] of Object.entries(map)) {
            if(condition(key, value)) {
                ret[key] = value
            }
        }
        return ret
    }
}