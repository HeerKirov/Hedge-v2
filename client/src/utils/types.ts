export const maps = {
    mapArray<V, R>(m: {[k: string]: V}, trans: (k: string, v: V) => R): R[] {
        const ret: R[] = []
        for(const k in m) {
            ret.push(trans(k, m[k]))
        }
        return ret
    }
}
