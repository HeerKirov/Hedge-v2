export const arrays = {
    newArray<T>(length: number, generator: (index: number) => T): T[] {
        return Array(length).fill(null).map((_, index) => generator(index))
    }
}