import VirtualGrid from "./VirtualGrid"
import VirtualRow from "./VirtualRow"
export type { ScrollView } from "./basic"
export { useScrollView } from "./basic"
export { VirtualGrid, VirtualRow }

/*
 * 这里提供虚拟滚动视图组件。
 * 虚拟滚动视图组件根据当前滚动位置，自动向接入的数据源请求数据，并且不要求数据源的结果与请求一致，自动处理得到的数据的理应的位置，以保证最好的异步体验。
 * 目前提供了两类虚拟滚动视图。
 * - Row: 每条数据占据一行，要求每行的高度固定。
 * - Grid: 数据组成格子，要求每个格子的宽高比固定，并由宽度决定高度。
 */
