import SearchPicker from "./SearchPicker"
import SearchBoxPicker from "./SearchBoxPicker"
import { SearchRequestFunction, HistoryPushFunction, HistoryRequestFunction, SearchResultAttachItem } from "./inject"

export { SearchPicker, SearchBoxPicker }
export type { SearchRequestFunction, HistoryPushFunction, HistoryRequestFunction, SearchResultAttachItem }

/*
 * 此处提供搜索选择器组件。作用是从指定的方式中搜索并pick出选择项。
 * 目前提供两种组件。
 * - SearchPicker: 基本组件。提供picker的基本功能面板。
 * - SearchBoxPicker: 搜索框与弹出面板的扩展组件。
 */
