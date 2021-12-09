import { computed, defineComponent, inject, InjectionKey, nextTick, onBeforeMount, PropType, provide, ref, watch } from "vue"
import { useHttpClient } from "@/functions/app"
import { useToast } from "@/functions/module/toast"
import { SendRefEmitter, useListeningEvent, useRefEmitter } from "@/functions/utils/emitter"
import { date } from "@/utils/datetime"
import { sleep } from "@/utils/process"
import { usePartitionContext } from "./inject"
import style from "./style.module.scss"

/**
 * 时间线形态的面板。
 * 有两个列表，分别是作为主列表的日期列表和作为导航列表的月份列表。
 * 装载此组件时，首先两个列表分别从对应API拉取数据。之后，将context的calendarDate作为当前选中的月份，令日期列表滚动到此月份的位置显示。
 * 当日期列表发生滚动时，将处于视野中央的月份作为主体月份，修改calendarDate。月份列表总是响应calendarDate的更改，高亮显示并滚动到此月份。
 * 当点击月份列表的项目时，使用事件侦听器通知日期列表(不使用calendarDate是为了防止传播混淆)滚动到目标月份，并修改calendarDate。
 */
export default defineComponent({
    setup() {
        provide(communicationInjection, {
            monthAnchor: useRefEmitter<`${number}-${number}`>()
        })

        return () => <div class={style.timeline}>
            <div class={style.leftColumn}>
                <PartitionList/>
            </div>
            <div class={style.rightColumn}>
                <MonthList/>
            </div>
        </div>
    }
})

/**
 * 日期列表。
 */
const PartitionList = defineComponent({
    setup() {
        const toast = useToast()
        const httpClient = useHttpClient()
        const { calendarDate, detail } = usePartitionContext()
        const { monthAnchor } = inject(communicationInjection)!

        const onClick = ({ year, month }: {year: number, month: number}, { day }: {day: number}) => () => {
            detail.value = date.ofDate(year, month, day)
        }

        const partitions = ref<{year: number, month: number, day: number, title: string, count: number}[]>([])

        const partitionsByMonth = computed(() => {
            type PartitionByMonth = {key: `${number}-${number}`, year: number, month: number, items: {day: number, title: string, count: number}[]}
            const ret: PartitionByMonth[] = []
            let m: PartitionByMonth | null = null
            for (const p of partitions.value) {
                if(m === null || m.year !== p.year || m.month !== p.month) {
                    m = {key: `${p.year}-${p.month}`, year: p.year, month: p.month, items: [{day: p.day, title: p.title, count: p.count}]}
                    ret.push(m)
                }else{
                    m.items.push({day: p.day, title: p.title, count: p.count})
                }
            }
            return ret
        })

        onBeforeMount(async () => {
            //初次加载，首先读取数据
            const res = await httpClient.partition.list({})
            if(!res.ok) {
                partitions.value = []
                toast.handleException(res.exception)
                return
            }
            //生成分区数据
            partitions.value = res.data.map(p => ({year: p.date.year, month: p.date.month, day: p.date.day, count: p.count, title: `${p.date.year}年${p.date.month}月${p.date.day}日`}))
            //等待nextTick，domRef已加载，然后将calendarDate指定的pm滚动到视野内
            await nextTick()
            pmRefs[`${calendarDate.value.year}-${calendarDate.value.month}`]?.scrollIntoView({behavior: "auto"})
            //再暂停一下，等待dom执行完毕，之后才允许滚动行为触发事件，否则上一个滚动指令有可能直接更改calendarDate
            await sleep(100)
            enableScrollEvent = true
        })

        let enableScrollEvent: boolean = false

        const scrollEvent = (e: Event) => {
            if(enableScrollEvent) {
                const target = (e.target as HTMLDivElement)
                //计算当前可视范围的中线位置
                const rangeMid = target.scrollTop + target.offsetHeight / 2
                //首先检查现在的calendarDate是否在中线上
                const currentPmRef = pmRefs[`${calendarDate.value.year}-${calendarDate.value.month}`] as HTMLDivElement | undefined
                if(currentPmRef) {
                    const elMin = currentPmRef.offsetTop, elMax = currentPmRef.offsetHeight + currentPmRef.offsetTop
                    if(elMin < rangeMid && elMax > rangeMid) {
                        //当前pm仍在时跳过后续步骤
                        return
                    }
                }
                for(const pm of Object.keys(pmRefs)) {
                    const pmRef = pmRefs[pm] as HTMLDivElement
                    const elMin = pmRef.offsetTop, elMax = pmRef.offsetHeight + pmRef.offsetTop
                    if(elMin < rangeMid && elMax > rangeMid) {
                        //找到位于中线上的pm
                        const [y, m] = pm.split("-", 2)
                        calendarDate.value = {year: parseInt(y), month: parseInt(m)}
                        break
                    }
                }
            }
        }

        let pmRefs: Record<`${number}-${number}`, HTMLDivElement> = {}

        useListeningEvent(monthAnchor, async pm => {
            //收到月份列表的点击事件从而需要滚动。在滚动之前禁用滚动事件，因为不希望此滚动指令更改calendarDate
            enableScrollEvent = false
            pmRefs[pm]?.scrollIntoView({behavior: "auto"})
            await sleep(100)
            enableScrollEvent = true
        })

        return () => {
            pmRefs = {}
            return <div class={style.timelineList} onScroll={scrollEvent}>
                {partitionsByMonth.value.map(pm => <div key={pm.key} ref={el => pmRefs[pm.key] = el as HTMLDivElement}>
                    {pm.items.map(p => <TimelineItem key={p.title} title={p.title} message={`${p.count}项`} colorFilled={true} onClick={onClick(pm, p)}/>)}
                </div>)}
            </div>
        }
    }
})

/**
 * 月份列表。
 */
const MonthList = defineComponent({
    setup() {
        const toast = useToast()
        const httpClient = useHttpClient()
        const { calendarDate } = usePartitionContext()
        const { monthAnchor } = inject(communicationInjection)!

        const partitionMonths = ref<({year: number, month: number, key: `${number}-${number}`, title: string, message: string})[]>([])

        onBeforeMount(async () => {
            const res = await httpClient.partition.monthList()
            if(!res.ok) {
                partitionMonths.value = []
                toast.handleException(res.exception)
                return
            }
            partitionMonths.value = res.data.map(p => ({year: p.year, month: p.month, key: `${p.year}-${p.month}`, title: `${p.year}年${p.month}月`, message: `${p.count}项 /${tenOrSpace(p.dayCount)}天`}))
            if(res.data.length > 0 && !res.data.find(p => p.year === calendarDate.value.year && p.month === calendarDate.value.month)) {
                //在当前选择月份不存在的情况下，滚动到存在数据的最后一个月份
                const {year, month} = res.data[res.data.length - 1]
                calendarDate.value = {year, month}
            }
        })

        const onClick = ({ year, month, key }: {year: number, month: number, key: `${number}-${number}`}) => () => {
            if(calendarDate.value.year !== year || calendarDate.value.month !== month) {
                calendarDate.value = {year, month}
                monthAnchor.emit(key)
            }
        }

        watch(calendarDate, async calendarDate => {
            //在calendarDate变化后，被选中的项会发生变化。而在变化后，需要将目标项滚动到视野内
            monthRefs[`${calendarDate.year}-${calendarDate.month}`]?.scrollIntoView({behavior: "auto"})
        })

        let monthRefs: Record<`${number}-${number}`, HTMLDivElement> = {}

        return () => {
            monthRefs = {}
            return <div class={style.timelineList}>
                {partitionMonths.value.map(p => <TimelineItem setRef={el => monthRefs[p.key] = el} key={p.key}
                                                              title={p.title} message={p.message} onClick={onClick(p)}
                                                              colorFilled={calendarDate.value.year === p.year && calendarDate.value.month === p.month}/>)}
            </div>
        }
    }
})

const TimelineItem = defineComponent({
    props: {
        title: {type: String, required: true},
        message: String,
        colorFilled: Boolean,
        setRef: Function as PropType<(el: HTMLDivElement) => void>
    },
    setup(props) {
        return () => <div ref={props.setRef !== undefined ? (el => props.setRef!(el as HTMLDivElement)) : undefined}
                          class={{"block": true, "is-link": props.colorFilled, [style.item]: true}}>
            <i class="fa fa-th-list mr-2"/>{props.title}
            {props.message && <div class={style.floatRightMessage}>{props.message}</div>}
        </div>
    }
})

function tenOrSpace(n: number): string | number {
    return n >= 10 ? n : ` ${n}`
}

interface CommunicationContext {
    monthAnchor: SendRefEmitter<`${number}-${number}`>
}

const communicationInjection: InjectionKey<CommunicationContext> = Symbol()
