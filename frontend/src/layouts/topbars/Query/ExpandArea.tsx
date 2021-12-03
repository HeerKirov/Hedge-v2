import { defineComponent, PropType } from "vue"
import {
    CompileError, QueryPlan, QueryRes, Element, ElementValue,
    ElementItem, FilterItem, FilterOfOneField, FilterValue
} from "@/functions/adapter-http/impl/utils-query"
import { arrays } from "@/utils/collections"
import { ELEMENT_TYPES, FIELD_NAMES } from "./translate"
import style from "./style.module.scss"

export default defineComponent({
    props: {
        schema: {type: Object as PropType<QueryRes>, required: true}
    },
    setup(props) {
        return () => <div class={style.expandArea}>
            {props.schema.queryPlan && <QueryPlanDisplay plan={props.schema.queryPlan}/>}
            {props.schema.errors.map(e => <CompileErrorToast e={e} type="danger"/>)}
            {props.schema.warnings.map(e => <CompileErrorToast e={e} type="warning"/>)}
        </div>
    }
})

function QueryPlanDisplay({ plan }: {plan: QueryPlan}) {
    return <div class={style.queryPlan}>
        {plan.elements.map(element => <ElementDisplay element={element}/>)}
        {plan.filters.map(filterItem => <FilterItemDisplay filterItem={filterItem}/>)}
        {plan.orders.length > 0 && <OrderItemDisplay orders={plan.orders}/>}
    </div>
}

function OrderItemDisplay({ orders }: {orders: string[]}) {
    return <div class={style.orderItem}>
        <div class={style.name}><b>排序</b></div>
        {orders.map(o => [o.charAt(0) === "-", o.substr(1)] as const).map(([desc, fieldName]) => <span class="tag mr-half mb-half">
            <b class={style.prefixSymbol}>{desc ? "-" : "+"}</b>
            {FIELD_NAMES[fieldName]}
        </span>)}
    </div>
}

function FilterItemDisplay({ filterItem }: {filterItem: FilterItem}) {
    return <div class={style.filterItem}>
        <div class={style.exclude}>{filterItem.exclude ? "-" : ""}</div>
        <div class={style.fields}>
            {arrays.insertGap(filterItem.fields.map(oneField => <FilterOneFieldDisplay field={oneField}/>), () => <b class="ml-1 mr-half">|</b>)}
        </div>
    </div>
}

function FilterOneFieldDisplay({ field }: {field: FilterOfOneField}) {
    return <>
        <div class={style.fieldName}><b>{FIELD_NAMES[field.name] ?? field.name}</b></div>
        {field.values.map(value => <FilterValueDisplay class="mr-half mb-half" value={value}/>)}
    </>
}

function FilterValueDisplay({ value }: {value: FilterValue}) {
    return value.type === "equal" ?
            <span class="tag">{value.value}</span>
        : value.type === "match" ?
            <span class="tag"><b class={style.prefixSymbol}>≈</b>{value.value}</span>
        : value.begin !== null && value.end !== null ?
            <span class="tag">
                <b class="mr-1">{value.includeBegin ? "[" : "("}</b>
                {value.begin}<b class="mx-1">~</b>{value.end}
                <b class="ml-1">{value.includeEnd ? "]" : ")"}</b>
            </span>
        : value.begin !== null ?
            <span class="tag"><b class={style.prefixSymbol}>{value.includeBegin ? "≥" : ">"}</b>{value.begin}</span>
        :
            <span class="tag"><b class={style.prefixSymbol}>{value.includeEnd ? "≤" : "<"}</b>{value.end}</span>
}

function ElementDisplay({ element }: {element: Element}) {
    const type = ELEMENT_TYPES[element.type]

    return <div class={style.element}>
        <div class={style.elementType}><b>{type}</b></div>
        <div class={style.intersectItems}>
            {arrays.insertGap(element.intersectItems.map(intersectItem => <ElementItemDisplay intersectItem={intersectItem}/>), () => <b class="ml-half mr-1">&</b>)}
        </div>
    </div>
}

function ElementItemDisplay({ intersectItem }: {intersectItem: ElementItem<ElementValue>}) {
    return <>
        {intersectItem.exclude && <span class="mr-half">-</span>}
        {intersectItem.unionItems.map(unionItem => <ElementValueDisplay class="mr-half mb-half" value={unionItem}/>)}
    </>
}

function ElementValueDisplay({ value }: {value: ElementValue}) {
    return value.type === "annotation" ? <span class="tag"><b>[</b><span class="mx-1">{value.name}</span><b>]</b></span>
        : value.type === "source-tag" ? <span class="tag">{value.name}</span>
        : value.type === "tag" ? <span class={{"tag": true, [`is-${value.color}`]: !!value.color, "is-light": value.tagType !== "TAG"}}>{value.name}</span>
        : value.type !== undefined ? <span class={{"tag": true, [`is-${value.color}`]: !!value.color}}>{value.name}</span>
        : /* name */ <span class="tag">{value.value}</span>
}

function CompileErrorToast({ e, type }: {e: CompileError, type: "warning" | "danger"}) {
    //TODO 完成所有编译错误信息的翻译
    return <div class={`block p-1 mt-1 has-radius-small is-light is-${type} has-border-${type}`}>
        {`[${e.code}]`}
        <b>{e.happenPosition && ` (${e.happenPosition.begin}, ${e.happenPosition.end ?? e.happenPosition.begin})`}</b>
        : {e.message}
    </div>
}

