import { SourceMappingMetaItem, SourceMappingMetaItemForm, SourceTag, SourceTagForm } from "@/functions/adapter-http/impl/source-tag-mapping"

/**
 * 结合旧的和新的mapping source tag，patch出需要提交到server的表单内容。
 */
export function patchMappingSourceTagToForm(items: SourceMappingMetaItem[], oldItems: SourceMappingMetaItem[]): SourceMappingMetaItemForm[] {
    return items.map(item => {
        const oldItem = oldItems.find(i => i.source === item.source && i.name === item.name)
        if(oldItem === undefined) {
            //这是一个新项
            return {source: item.source, name: item.name, displayName: item.displayName || undefined, type: item.type || undefined}
        }else{
            //这是一个修改项
            return {
                source: item.source,
                name: item.name,
                displayName: (item.displayName || null) !== (oldItem.displayName || null) ? (item.displayName || "") : undefined,
                type: (item.type || null) !== (oldItem.type || null) ? (item.type || "") : undefined
            }
        }
    })
}

/**
 * 结合旧的和新的source tag，patch出需要提交到server的表单内容。
 */
export function patchSourceTagToForm(items: SourceTag[], oldItems: SourceTag[]): SourceTagForm[] {
    return items.map(item => {
        const oldItem = oldItems.find(i => i.name === item.name)
        if(oldItem === undefined) {
            //这是一个新项
            return {name: item.name, displayName: item.displayName || undefined, type: item.type || undefined}
        }else{
            //这是一个修改项
            return {
                name: item.name,
                displayName: (item.displayName || null) !== (oldItem.displayName || null) ? (item.displayName || "") : undefined,
                type: (item.type || null) !== (oldItem.type || null) ? (item.type || "") : undefined
            }
        }
    })
}
