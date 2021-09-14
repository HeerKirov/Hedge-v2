

export function onKeyEnter(func: (e: KeyboardEvent) => void) {
    return function(e: KeyboardEvent) {
        if(e.key === "Enter") {
            func(e)
        }
    }
}
