import { analyseKeyPress } from "./definition"
import type { KeyPress, KeyCode } from "./definition"
import type { KeyEvent } from "./event"
import { onKeyEnter, keyboardEventCheck, keyEventCheck, createKeyboardEventChecker, createKeyEventChecker, toKeyEvent } from "./event"
import { installGlobalKey, watchGlobalKeyEvent, interceptGlobalKey } from "./global"

export { KeyPress, KeyCode, KeyEvent, analyseKeyPress,
    keyboardEventCheck, keyEventCheck, createKeyboardEventChecker, createKeyEventChecker, onKeyEnter, toKeyEvent,
    installGlobalKey, watchGlobalKeyEvent, interceptGlobalKey
}
