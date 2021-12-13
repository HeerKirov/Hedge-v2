import { assetsUrl } from "@/functions/app"
import { numbers } from "@/utils/primitives"
import style from "./OneImage.module.scss"

export default function (props: {
    value: string,
    aspect?: number,
    radius?: "small" | "std" | "large", boxShadow?: boolean
}) {
    const aspect = props.aspect ?? 1
    const sizeStyle = {
        "paddingBottom": `${numbers.round2decimal(100 / aspect)}%`
    }
    return <div class={[style.image, props.boxShadow && style.boxShadow, props.radius && radiusClass[props.radius]]} style={sizeStyle}>
        <img alt={undefined} src={assetsUrl(props.value)}/>
    </div>
}

const radiusClass = {
    "small": style.radiusSmall,
    "std": style.radiusStd,
    "large": style.radiusLarge,
}
