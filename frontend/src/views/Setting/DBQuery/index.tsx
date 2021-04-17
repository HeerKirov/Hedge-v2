import { defineComponent, ref } from "vue"
import { usePropertySot } from "@/functions/utils/properties/setter-property"
import { useSettingQuery } from "../setting"
import CheckBox from "@/components/forms/CheckBox"
import NumberInput from "@/components/forms/NumberInput"

export default defineComponent({
    setup() {
        const { loading, data } = useSettingQuery()

        const [ queryLimitOfQueryItems, queryLimitOfQueryItemsSot, setQueryLimitOfQueryItems, saveQueryLimitOfQueryItems ] = usePropertySot(ref(data.value?.queryLimitOfQueryItems),
            () => data.value?.queryLimitOfQueryItems,
            v => v,
            v => data.value!.queryLimitOfQueryItems = v!)

        const [ warningLimitOfIntersectItems, warningLimitOfIntersectItemsSot, setWarningLimitOfIntersectItems, saveWarningLimitOfIntersectItems ] = usePropertySot(ref(data.value?.warningLimitOfIntersectItems),
            () => data.value?.warningLimitOfIntersectItems,
            v => v,
            v => data.value!.warningLimitOfIntersectItems = v!)

        const [ warningLimitOfUnionItems, warningLimitOfUnionItemsSot, setWarningLimitOfUnionItems, saveWarningLimitOfUnionItems ] = usePropertySot(ref(data.value?.warningLimitOfUnionItems),
            () => data.value?.warningLimitOfUnionItems,
            v => v,
            v => data.value!.warningLimitOfUnionItems = v!)

        return () => loading.value ? <div/> : <div>
            <p class="mb-3 is-size-medium">查询选项</p>
            <div class="mt-2">
                <CheckBox value={data.value!.chineseSymbolReflect} onUpdateValue={v => data.value!.chineseSymbolReflect = v}>识别中文字符</CheckBox>
                <p class="is-size-8 has-text-grey">查询语句中的中文字符会被识别为有效的符号。会被识别的中文字符包括<code>：～（）【】「」｜，。《》</code>。</p>
            </div>
            <div class="mt-2">
                <CheckBox value={data.value!.translateUnderscoreToSpace} onUpdateValue={v => data.value!.translateUnderscoreToSpace = v}>转义普通下划线</CheckBox>
                <p class="is-size-8 has-text-grey">在受限字符串、关键字等非无限字符串位置的下划线(<code>_</code>)会被转义成空格。</p>
            </div>
            <div class="mt-1">
                <label class="label">单点查询数量上限</label>
                <div class="group">
                    <NumberInput class="is-width-half" value={queryLimitOfQueryItems.value} onUpdateValue={setQueryLimitOfQueryItems}/>
                    {queryLimitOfQueryItemsSot.value && <button class="square button is-info is-small" onClick={saveQueryLimitOfQueryItems}><i class="fa fa-save"/></button>}
                </div>
                <p class="is-size-8 has-text-grey">查询结果优化：在对查询语句中的标签进行预查询时，对每个标签元素的单次查询的结果数限制。将此值设置在一个较低的水平，能有效规避输入匹配泛用性过强的查询时，获得的标签结果太多的情况。</p>
            </div>
            <div class="mt-1">
                <label class="label">元素项中元素数警告阈值</label>
                <div class="group">
                    <NumberInput class="is-width-half" value={warningLimitOfUnionItems.value} onUpdateValue={setWarningLimitOfUnionItems}/>
                    {warningLimitOfUnionItemsSot.value && <button class="square button is-info is-small" onClick={saveWarningLimitOfUnionItems}><i class="fa fa-save"/></button>}
                </div>
                <p class="is-size-8 has-text-grey">查询警告：如果一个元素项中，元素数超出了阈值，就会提出警告。在执行查询时，以OR方式连接的元素数过多，可能拖慢查询效率。</p>
            </div>
            <div class="mt-1">
                <label class="label">元素项数警告阈值</label>
                <div class="group">
                    <NumberInput class="is-width-half" value={warningLimitOfIntersectItems.value} onUpdateValue={setWarningLimitOfIntersectItems}/>
                    {warningLimitOfIntersectItemsSot.value && <button class="square button is-info is-small" onClick={saveWarningLimitOfIntersectItems}><i class="fa fa-save"/></button>}
                </div>
                <p class="is-size-8 has-text-grey">查询警告：如果元素项的总数超出了阈值，就会提出警告。在执行查询时，以AND方式连接的元素数过多，可能严重拖慢查询效率。</p>
            </div>
        </div>
    }
})
