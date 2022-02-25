export type KeyPress = KeyCode
    | `${KeyFuncMeta}+${KeyCode}` | `${KeyFuncAlt}+${KeyCode}`
    | `${KeyFuncMeta}+${KeyFuncShift}+${KeyCode}` | `${KeyFuncAlt}+${KeyFuncShift}+${KeyCode}`
    | `${KeyFuncMeta}+${KeyFuncAlt}+${KeyCode}` | `${KeyFuncMeta}+${KeyFuncAlt}+${KeyFuncShift}+${KeyCode}`

type KeyFuncAlt = "Alt"
type KeyFuncMeta = "Meta"
type KeyFuncShift = "Shift"

export type KeyCode = "Enter" | "Escape" | "Backspace" | "Tab" | "Space"  | KeyCodeArrow | KeyCodeDigit | KeyCodeKey | KeyCodeSignal

type KeyCodeArrow = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight"
type KeyCodeSignal
    = /* ` */ "Backquote"
    | /* - */ "Minus"
    | /* = */ "Equal"
    | /* [ */ "BracketLeft"
    | /* ] */ "BracketRight"
    | /* \ */ "Backslash"
    | /* ; */ "Semicolon"
    | /* ' */ "Quote"
    | /* , */ "Comma"
    | /* . */ "Period"
    | /* / */ "Slash"
type KeyCodeDigit = `Digit${"0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"}`
type KeyCodeKey = `Key${"A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z"}`

export interface AnalysedKeyPress {key: KeyCode, altKey: boolean, shiftKey: boolean, metaKey: boolean}

/**
 * 解析keyPress格式的按键描述，将其转换为结构化的按键描述。
 * @param key
 */
export function analyseKeyPress(key: KeyPress): AnalysedKeyPress {
    const matcher = key.match(/(Meta\+)?(Alt\+)?(Shift\+)?(.+)/)
    if(matcher) {
        const metaKey = matcher[1] !== undefined
        const altKey = matcher[2] !== undefined
        const shiftKey = matcher[3] !== undefined
        const key = matcher[4]! as KeyCode
        return {key, altKey, metaKey, shiftKey}
    }
    throw new Error(`KeyPress ${key} is not supported.`)
}
