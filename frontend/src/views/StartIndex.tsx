import { defineComponent, Ref, ref, TransitionGroup } from "vue"
import BottomBar from "./layouts/Start/BottomBar"

export default defineComponent({
    setup() {
        const databases = [
            {name: 'default', description: '默认的数据库', path: '~/Library/Application Support/Hedge-v2/databases/default'},
            {name: 'custom', description: '...', path: '~/Library/Application Support/Hedge-v2/databases/custom'},
            {name: 'custom2', description: '...', path: '~/Library/Application Support/Hedge-v2/databases/custom2'}
        ]
        const selectedIndex: Ref<number> = ref(0)
        const openedIndex: Ref<number | null> = ref(0)

        const plus = () => {
            databases.push({name: 'custom2', description: '...', path: '~/Library/Application Support/Hedge-v2/databases/custom2'})
        }

        return () => <div class="v-start-index">
            <div class="v-content">
                <TransitionGroup name="v-transition-list" tag="div" class="v-list">
                    {() => databases.map((v, i) => {
                        const isMain = i === selectedIndex.value
                        const offset = (i - selectedIndex.value) * 225 - (i > selectedIndex.value ? 100 : i < selectedIndex.value ? 150 : 125)

                        return <div class={`box v-box ${isMain ? "main" : "secondary"} has-text-centered`}
                                    style={{"left": `calc(50% + (${offset}px))`}}
                                    key={i} onClick={() => selectedIndex.value = i}>
                            <i class={`fa fa-${isMain ? 4 : 3}x fa-warehouse my-6`}/>
                            <p class={`is-size-${isMain ? 4 : 5}`}><b>{v.name}</b></p>
                            <p>{v.description}</p>
                            {isMain && <div class="v-path-text">{v.path}</div>}
                        </div>
                    })}
                </TransitionGroup>
            </div>
            <BottomBar>
                {() => <>
                    <button class="button is-small is-light mr-5"><i class="fa fa-trash mr-2"></i>删除</button>
                    {openedIndex.value == null ?
                        <button class="button is-info is-medium"><i class="fa fa-inbox mr-4"></i>打开</button>
                    : selectedIndex.value == openedIndex.value ?
                        <button class="button is-link is-medium"><i class="fa fa-inbox mr-4"></i>打开</button>
                    :
                        <button class="button is-info is-medium"><i class="fa fa-sync mr-4"></i>切换</button>
                    }
                    <button onClick={plus} class="button is-small is-light ml-5"><i class="fa fa-edit mr-2"></i>编辑</button>
                </>}
            </BottomBar>
        </div>
    }
})