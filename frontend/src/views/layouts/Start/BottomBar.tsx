import { defineComponent } from "vue"

export default defineComponent({
    setup(_, { slots }) {
        return () => <nav class="level v-buttons">
            <div class="level-left">
                <div class="buttons">
                    <button class="button is-medium is-light"><span class="icon"><i class="fa fa-question-circle"></i></span></button>
                    <button class="button is-medium is-light"><span class="icon"><i class="fa fa-cog"></i></span></button>
                </div>
            </div>
            <div class="level-item">{slots}</div>
            <div class="level-right">
                <div class="buttons">
                    <button class="button is-medium is-light"><span class="icon"><i class="fa fa-folder-plus"></i></span></button>
                    <button class="button is-medium is-light"><span class="icon"><i class="fa fa-folder-open"></i></span></button>
                </div>
            </div>
        </nav>
    }
})