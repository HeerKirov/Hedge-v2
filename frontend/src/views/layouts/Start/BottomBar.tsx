import { defineComponent } from "vue"
import { RouterLink, useRouter } from "vue-router"

export default defineComponent({
    setup(_, { slots }) {
        const router = useRouter()

        const routeTo = (routeName: string) => {
            return () => router.push({name: routeName})
        }
        
        return () => <div class="v-bottom-bar">
            <nav class="level v-buttons">
                <div class="level-left">
                    <div class="buttons">
                        <button class="button is-medium is-light"><span class="icon"><i class="fa fa-question-circle"></i></span></button>
                        <button class="button is-medium is-light"><span class="icon"><i class="fa fa-cog"></i></span></button>
                    </div>
                </div>
                <div class="level-item">
                    {Object.keys(slots).length > 0 ? 
                        slots
                    :
                        <button onClick={routeTo("StartIndex")} class="button is-light is-medium"><i class="fa fa-inbox mr-4"/>列表</button>
                    }
                </div>
                <div class="level-right">
                    <div class="buttons">
                        <button onClick={routeTo("StartNew")} class="button is-medium is-light"><span class="icon"><i class="fa fa-folder-plus"></i></span></button>
                        <button onClick={routeTo("StartImport")} class="button is-medium is-light"><span class="icon"><i class="fa fa-folder-open"></i></span></button>
                    </div>
                </div>
            </nav>
        </div>
    }
})