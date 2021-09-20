import { computed, defineComponent, PropType, ref } from "vue"
import { watchElementExcludeClick } from "@/functions/utils/element"
import style from "./style.module.scss"

type HorizontalPosition = "left" | "right"
type VerticalPosition = "top" | "bottom"
export type Position = HorizontalPosition | VerticalPosition | `${HorizontalPosition}-${VerticalPosition}` | `${VerticalPosition}-${HorizontalPosition}`

export interface Rect {
    x: number
    y: number
    width?: number
    height?: number
}

/**
 * 浮动显示的box对象。自动根据base和position等进行坐标对齐。
 */
export default defineComponent({
    props: {
        /**
         * 基准位置。这个位置可以是个坐标，也可以是个矩形区域，并自动根据选项决定环绕在矩形区域的何处。
         */
        base: {type: Object as PropType<Rect>, required: true},
        /**
         * 显示区域的宽度。可不写表示变长，但也会失去自动调节此方向的位置的能力，仅根据选项决定基准位置。
         */
        width: Number,
        /**
         * 显示区域的宽度。可不写表示变长，但也会失去自动调节此方向的位置的能力，仅根据选项决定基准位置。
         */
        height: Number,
        /**
         * 基准方位。第一项是相对base弹出的方向，第二项是另一个方向对齐时自身的基准位置。
         */
        position: {type: String as PropType<Position>, default: "right"},
        /**
         * 相对base弹出方向上的弹性偏移量。通常会额外偏移这么多距离，但大小不够时会节省掉偏移量部分。
         */
        directionOffset: {type: Number, default: 0},
        /**
         * 弹性偏移量的最小值，即最小不小于这么多的边距。需要注意的是，如果对象在基准方向上被弹到另一边，则总是会使用最小值作为边距。
         */
        directionOffsetMin: {type: Number, default: 0},
        /**
         * 在对齐方向上的偏移量。这个值仅在对齐方向不是center时有效，并向对齐方向上偏移。
         */
        alignOffset: {type: Number, default: 0}
    },
    emits: ["close"],
    setup(props, { emit, slots }) {
        const divRef = ref<HTMLElement>()

        const css = computed(() => {
            const split = props.position.split("-", 2)
            const direction = split[0] as HorizontalPosition | VerticalPosition
            const selfPosition = (split[1] ?? "center") as HorizontalPosition | VerticalPosition | "center"

            const base = {x: props.base.x, y: props.base.y, width: props.base.width ?? 0, height: props.base.height ?? 0}
            const body = {width: document.body.clientWidth, height: document.body.clientHeight}

            const properties: {left?: number, right?: number, top?: number, bottom?: number, transformX?: number, transformY?: number} = {}

            if(props.width !== undefined) {
                //计算x坐标
                if(direction === "left") {
                    if(props.width + props.directionOffset <= base.x) {
                        //宽度能夹进base左边的缝里，包括offset
                        properties["left"] = base.x - props.width - props.directionOffset
                    }else if(props.width + props.directionOffsetMin <= base.x) {
                        //宽度能夹进base左边的缝里，但会压缩offset
                        properties["left"] = 0
                    }else{
                        //夹不进去，就放到右边，并不关心右边能不能放进去
                        properties["left"] = base.x + base.width + props.directionOffsetMin
                    }
                }else if(direction === "right") {
                    if(props.width + props.directionOffset <= body.width - (base.x + base.width)) {
                        //宽度能夹进base右边的缝里
                        properties["left"] = base.x + base.width + props.directionOffset
                    }else if(props.width + props.directionOffsetMin <= body.width - (base.x + base.width)) {
                        //宽度能夹进base右边的缝里，但会压缩offset
                        properties["right"] = 0
                    }else{
                        //夹不进去，就放到左边，并不关心左边能不能放进去
                        properties["left"] = base.x - props.width - props.directionOffsetMin
                    }
                }else if(selfPosition === "left") {
                    //与base的左侧对齐
                    properties["left"] = base.x - props.alignOffset
                }else if(selfPosition === "right") {
                    //与base的右侧对齐
                    properties["left"] = base.x + base.width - props.width + props.alignOffset
                }else{
                    //与base的中间对齐
                    properties["left"] = base.x + base.width / 2 - props.width / 2
                }
            }else{
                //未给出width时，定位方式有所不同，且总是固定在基准方位上不会自动调整
                if(direction === "left") {
                    properties["right"] = body.width - base.x + props.directionOffset
                }else if(direction === "right") {
                    properties["left"] = base.x + base.width + props.directionOffset
                }else if(selfPosition === "left") {
                    properties["left"] = base.x - props.alignOffset
                }else if(selfPosition === "right") {
                    properties["right"] = base.x + base.width + props.alignOffset
                }else{
                    properties["left"] = base.x + base.width / 2
                    properties["transformX"] = -0.5
                }
            }

            if(props.height !== undefined) {
                //计算y坐标
                if(direction === "top") {
                    if(props.height + props.directionOffset <= base.y) {
                        //宽度能夹进base上边的缝里，包括offset
                        properties["top"] = base.y - props.height - props.directionOffset
                    }else if(props.height + props.directionOffsetMin <= base.y) {
                        //宽度能夹进base上边的缝里，但会压缩offset
                        properties["top"] = 0
                    }else{
                        //夹不进去，就放到下边，并不关心下边能不能放进去
                        properties["top"] = base.y + base.height + props.directionOffsetMin
                    }
                }else if(direction === "bottom") {
                    if(props.height + props.directionOffset <= body.height - (base.y + base.height)) {
                        //宽度能夹进base下边的缝里
                        properties["top"] = base.y + base.height + props.directionOffset
                    }else if(props.height + props.directionOffsetMin <= body.height - (base.y + base.height)) {
                        //宽度能夹进base下边的缝里，但会压缩offset
                        properties["bottom"] = 0
                    }else{
                        //夹不进去，就放到上边，并不关心左边能不能放进去
                        properties["top"] = base.y - props.height - props.directionOffsetMin
                    }
                }else if(selfPosition === "top") {
                    //与base上沿对齐
                    properties["top"] = base.y - props.alignOffset
                }else if(selfPosition === "bottom") {
                    //与base的下沿对齐
                    properties["top"] = base.y + base.height - props.height + props.alignOffset
                }else{
                    //与base的中间对齐
                    properties["top"] = base.y + base.height / 2 - props.height / 2
                }
            }else{
                //未给出height时，定位方式有所不同，且总是固定在基准方位上不会自动调整
                if(direction === "top") {
                    properties["bottom"] = body.height - base.y + props.directionOffset
                }else if(direction === "bottom") {
                    properties["top"] = base.y + base.height + props.directionOffset
                }else if(selfPosition === "top") {
                    properties["top"] = base.y - props.alignOffset
                }else if(selfPosition === "bottom") {
                    properties["bottom"] = base.y + base.height + props.alignOffset
                }else{
                    properties["top"] = base.y + base.height / 2
                    properties["transformY"] = -0.5
                }
            }

            return {
                "width": props.width !== undefined ? `${props.width}px` : undefined,
                "height": props.height !== undefined ? `${props.height}px` : undefined,
                "left": properties.left !== undefined ? `${properties.left}px` : undefined,
                "right": properties.right !== undefined ? `${properties.right}px` : undefined,
                "top": properties.top !== undefined ? `${properties.top}px` : undefined,
                "bottom": properties.bottom !== undefined ? `${properties.bottom}px` : undefined,
                "transform": properties.transformX !== undefined && properties.transformY !== undefined ?
                    `translate(${properties.transformX * 100}%, ${properties.transformY * 100}%)` :
                    properties.transformX !== undefined ? `translateX(${properties.transformX * 100}%)` :
                    properties.transformY !== undefined ? `translateY(${properties.transformY * 100}%)` :
                        undefined
            }
        })

        watchElementExcludeClick(divRef, () => emit("close"))

        return () => <div ref={divRef} style={css.value} class={style.calloutBox}>
            {slots.default?.()}
        </div>
    }
})
