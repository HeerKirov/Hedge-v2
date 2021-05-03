import { arrays, maps } from "@/utils/collections"

export const numbers = {
    round2decimal(n: number): number {
        return Math.round(n * 100) / 100
    },
    floorHalfDecimal(n: number): number {
        return Math.floor(n * 2) / 2
    },
    between(min: number, value: number, max: number): number {
        return value < min ? min : value > max ? max : value
    }
}

export const objects = {
    deepEquals(a: any, b: any): boolean {
        const typeA = a === null ? "null" : typeof a, typeB = b === null ? "null" : typeof b

        if(typeA === "object" && typeB === "object") {
            const aIsArray = a instanceof Array, bIsArray = b instanceof Array
            if(aIsArray && bIsArray) {
                if(arrays.equals(a, b, objects.deepEquals)) {
                    return true
                }
            }else if(!aIsArray && !bIsArray) {
                if(maps.equals(a, b, objects.deepEquals)) {
                    return true
                }
            }
            return false
        }else if(typeA !== typeB) {
            return false
        }else{
            return a === b
        }
    },
    deepCopy<T>(any: T): T {
        const type = any === null ? "null" : typeof any
        if(type === "object") {
            if(any instanceof Array) {
                return any.map(v => objects.deepCopy(v)) as any as T
            }else{
                return maps.map(any as any as {}, v => objects.deepCopy(v)) as any as T
            }
        }else{
            return any
        }
    }
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}
