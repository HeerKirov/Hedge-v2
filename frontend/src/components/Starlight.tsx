import { defineComponent } from "vue"
import { arrays } from "../utils/collections"
import { numbers } from "../utils/primitives"

export default defineComponent({
    props: {
        value: Number,
        showText: {type: Boolean, default: false}
    },
    setup(props) {
        return () => {
            const value = numbers.round2decimal(props.value ?? 0)
            const doubleValue = Math.floor(value * 2)
            return <span>
                {props.showText && <b class="mr-1">{value}</b>}
                {arrays.newArray(Math.floor(doubleValue / 2), () => <i class="fa fa-star mr-1"/>)}
                {(doubleValue % 2 === 1 || null) && <i class="fa fa-star-half-alt mr-1"/>}
            </span>
        }
    }
})