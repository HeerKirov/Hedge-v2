import { maps } from "@/utils/collections"

export const numbers = {
    round2decimal(n: number): number {
        return Math.round(n * 100) / 100
    },
    floorHalfDecimal(n: number): number {
        return Math.floor(n * 2) / 2
    }
}

export const objects = {
    deepCopy<T>(any: T): T {
        const type = typeof any
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