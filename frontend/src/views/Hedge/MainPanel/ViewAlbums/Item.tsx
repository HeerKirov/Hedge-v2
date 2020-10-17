import { defineComponent } from "vue"

export default defineComponent({
    props: {
        src: String,
        title: String
    },
    setup(props) {
        return () => <div class="v-grid-item">
            <img src={props.src}/>
            <div>{props.title}</div>
        </div>
    }
})