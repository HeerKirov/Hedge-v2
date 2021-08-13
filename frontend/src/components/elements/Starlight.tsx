import { arrays } from "@/utils/collections"
import { numbers } from "@/utils/primitives"

export default function(props: {value?: number, showText?: boolean}) {
    const value = numbers.round2decimal(props.value ?? 0)

    return <div>
        {props.showText && <b class="mr-1">{value}</b>}
        {arrays.newArray(Math.floor(value / 2), () => <i class="fa fa-star mr-1"/>)}
        {(value % 2 === 1 || null) && <i class="fa fa-star-half-alt mr-1"/>}
    </div>
}