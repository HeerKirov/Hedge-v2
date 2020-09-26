import { defineComponent, ref } from "vue"

export default defineComponent({
    props: {msg: String},
    setup(props) {
        const count = ref(0)

        return () => <>
            <h1>{props.msg}</h1>
            <button onClick={() => { count.value++ }}><i class="fa fa-church"/>count is: {count.value}</button>
            <p>Edit <code>components/HelloWorld.tsx</code> to test hot module replacement.</p>
        </>
    }
})