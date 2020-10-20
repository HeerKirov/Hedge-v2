export const numbers = {
    round2decimal(n: number): number {
        return Math.round(n * 100) / 100
    },
    floorHalfDecimal(n: number): number {
        return Math.floor(n * 2) / 2
    }
}