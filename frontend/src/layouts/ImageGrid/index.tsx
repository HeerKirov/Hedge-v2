import { defineComponent, PropType } from "vue"
import ImageItem from "./Item"
import SelectToolBar from "./SelectToolBar"
import "./style.scss"

export interface ImageModel {
    type?: "item"
    id: number
    src: string
}

export interface TitleModel {
    type: "title"
    title: string
}

export type Item = ImageModel | TitleModel | string

/**
 * 列表区域。因为这一部分会复用，所以单独抽离出来。
 * 这一部分主要呈grid形态展示列表，并且提供选框功能。
 */
export default defineComponent({
    props: {
        marginTopBar: {type: Boolean, default: false},
        items: null as PropType<Item[]>
    },
    setup(props, { slots }) {
        return () => <div class="v-image-grid">
            <div class={`overflow-content ${props.marginTopBar ? "mt-title-bar" : ""}`}>
                {slots.header?.()}
                <div class="grid-content">
                    {props.items.map(item => {
                        if(typeof item === "string") {
                            return <ImageItem src={item} numTag={2} selected={item.endsWith(".png")}/>
                        }else if(item.type === "title") {
                            return <div key={item.title} class="line"><b>{item.title}</b></div> 
                        }else{
                            return <ImageItem key={item.id} src={item.src} numTag={2} selected={item.src.endsWith(".png")}/>
                        }
                    })}
                </div>
                {slots.footer?.()}
            </div>
            <SelectToolBar class="absolute right-bottom mr-5 mb-4"/>
        </div>
    }
})