export const arrays = {
    newArray<T>(length: number, generator: (index: number) => T): T[] {
        return Array(length).fill(null).map((_, index) => generator(index))
    },
    split<T>(arr: T[], condition: (prev: T, next: T) => boolean): T[][] {
        const result: T[][] = []
        let beginIndex = 0
        for(let i = 0; i < arr.length; i++) {
            if(i + 1 === arr.length || condition(arr[i], arr[i + 1])) {
                const part = arr.slice(beginIndex, i + 1)
                if(part.length) result.push(part)
                beginIndex = i + 1
            }
        }
        return result
    },
    window<T>(arr: T[], size: number): T[][] {
        const result: T[][] = []
        let beginIndex = 0
        for(let i = 0; i < arr.length; i++) {
            if(i + 1 === arr.length || (i != 0 && i % size === 0)) {
                const part = arr.slice(beginIndex, i + 1)
                if(part.length) result.push(part)
                beginIndex = i + 1
            }
        }
        return result
    },
    toMap<T extends string, R>(arr: T[], generator: (value: T) => R): {[key in T]: R} {
        const ret: {[key: string]: R} = {}
        for (const t of arr) {
            ret[t] = generator(t)
        }
        return <{[key in T]: R}>ret
    },
    equals<T>(a: T[], b: T[], equalsBy: (a: T, b: T) => boolean = (a, b) => a === b): boolean {
        if (a.length !== b.length) {
            return false
        }
        for (let i = 0; i < a.length; ++i) {
            if (!equalsBy(a[i], b[i])) {
                return false
            }
        }
        return true
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
    },
    equals<T>(a: {[key: string]: T}, b: {[key: string]: T}, equalsBy: (a: T, b: T) => boolean = (a, b) => a === b): boolean {
        const entriesA = Object.entries(a)
        if(entriesA.length !== Object.keys(b).length) {
            return false
        }
        for(const [key, valueA] of entriesA) {
            if(!b.hasOwnProperty(key) || !equalsBy(valueA, b[key])) {
                return false
            }
        }
        return true
    }
}
