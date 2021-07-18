import { arrays, maps } from "@/utils/collections"

export const numbers = {
    round2decimal(n: number): number {
        return Math.round(n * 100) / 100
    },
    roundNDecimal(n: number, len: number): number {
        const x = Math.pow(10, len)
        return Math.round(n * x) / x
    },
    floorHalfDecimal(n: number): number {
        return Math.floor(n * 2) / 2
    },
    between(min: number, value: number, max: number): number {
        return value < min ? min : value > max ? max : value
    },
    toBytesDisplay(byteSize: number): string {
        if(byteSize >= 1 << 30) {
            return `${numbers.roundNDecimal(byteSize / (1 << 30), 3)} GiB`
        }else if(byteSize >= 1 << 20) {
            return `${numbers.roundNDecimal(byteSize / (1 << 20), 3)} MiB`
        }else if(byteSize >= 1 << 10) {
            return `${numbers.roundNDecimal(byteSize / (1 << 10), 3)} KiB`
        }else{
            return `${numbers.roundNDecimal(byteSize, 3)} B`
        }
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
