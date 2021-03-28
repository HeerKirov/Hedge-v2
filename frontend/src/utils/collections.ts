export const arrays = {
    newArray<T>(length: number, generator: (index: number) => T): T[] {
        return Array(length).fill(null).map((_, index) => generator(index))
    },
    split<T>(arr: T[], condition: (prev: T, next: T) => boolean): T[][] {
        const result: T[][] = []
        let beginIndex = 0
        for(let i = 0; i < arr.length; i++) {
            if(i + 1 === arr.length || condition(arr[i], arr[i + 1])) {
                result.push(arr.slice(beginIndex, i + 1))
                beginIndex = i + 1
            }
        }
        return result
    }
}

export const maps = {
    map<T, R>(map: {[key: string]: T}, transfer: (value: T, key: string) => R): {[key: string]: R} {
        const ret: {[key: string]: R} = {}
        for(const [key, value] of Object.entries(map)) {
            ret[key] = transfer(value, key)
        }
        return ret
    },
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