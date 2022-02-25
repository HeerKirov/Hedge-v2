import { assetsUrl } from "@/services/app"
import { numbers } from "@/utils/primitives"
import style from "./GridImage.module.scss"

/**
 * 一个img的Grid组件。它用于将一组img组成Grid，并按指定的样式显示出来。
 * - 组件的列数是固定的，限制的范围是1～16。
 * - 组件中每个img的宽高比是固定的；
 * - 提供一些常规样式调整属性；
 * - 可以在img中通过slot的形式编辑自定义dom结构。
 */
export default function(props: {
    value: string[],
    columnNum?: number, aspect?: number,
    margin?: string, radius?: "small" | "std" | "large", boxShadow?: boolean,
    divClass?: string,
})
export default function<T>(props: {
    value: T[],
    columnNum?: number, aspect?: number,
    margin?: string, radius?: "small" | "std" | "large", boxShadow?: boolean,
    divClass?: string,
    eachKey?: EachKeyFunction<T>,
    eachSlot: EachSlotFunction<T>
})
export default function<T>(props: {
    value: T[],
    columnNum?: number, aspect?: number,
    margin?: string, radius?: "small" | "std" | "large", boxShadow?: boolean,
    divClass?: string,
    eachKey?: EachKeyFunction<T>,
    eachSlot?: EachSlotFunction<T>
}) {
    const columnNum = props.columnNum ?? 1
    const aspect = props.aspect ?? 1
    const margin = props.margin ?? "0.25rem"
    const gridSizeStyle = {
        "marginRight": `-${margin}`,
        "--image-width": `${numbers.round2decimal(100 / columnNum)}%`,
        "--image-padding-bottom": `${numbers.round2decimal(100 / aspect / columnNum)}%`,
        "--img-width": `calc(100% - ${margin})`,
        "--img-height": `calc(100% - ${margin})`,
    }

    const key = props.eachKey || ((t: T) => t as any as string)

    return <div class={[style.imageGrid, props.boxShadow && style.boxShadow, props.radius && radiusClass[props.radius]]} style={gridSizeStyle}>
        {props.eachSlot
            ? props.value?.map((image, index) => <CustomEachItem key={key(image)} value={image} index={index} divClass={props.divClass} eachSlot={props.eachSlot!}/>)
            : props.value?.map((image, index) => <EachItem key={key(image)} value={image as any as string} index={index} divClass={props.divClass} eachSlot={props.eachSlot!}/>)}
    </div>
}

function CustomEachItem<T>(props: {value: T, index: number, eachSlot: EachSlotFunction<T>, divClass?: string}) {
    return <div class={[style.image, props.divClass]}>
        {props.eachSlot(createImg, props.value, props.index)}
    </div>
}

function EachItem(props: {value: string, divClass?: string}) {
    return <div class={[style.image, props.divClass]}>
        {createImg(props.value)}
    </div>
}

function createImg(src: string, alt?: string) {
    return <img alt={alt} src={assetsUrl(src)}/>
}

const radiusClass = {
    "small": style.radiusSmall,
    "std": style.radiusStd,
    "large": style.radiusLarge,
}

type EachKeyFunction<T> = (item: T) => string | number | symbol | undefined
type EachSlotFunction<T> = (createImg: (src: string, alt?: string) => JSX.Element, item: T, index: number) => JSX.Element
