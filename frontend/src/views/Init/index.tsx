import { defineComponent, Ref, ref } from "vue"
import Input from "@/components/Input"
import "./style.scss"

export default defineComponent({
    setup() {
        const password: Ref<string | undefined> = ref()

        const page = ref(0)

        const next = () => { page.value += 1 }
        const prev = () => { page.value -= 1 }

        const onFinish = () => {

        }

        return () => <div id="init">
            <div class="title-bar"/>
        </div>

        // return () => <div id="init">
        //     <div class="title-bar"></div>
        //     <div class="v-dialog fixed center box">
        //         {[
        //             () => <WelcomePage onNext={next} />,
        //             () => <PasswordPage onNext={next} password={password.value} onUpdatePassword={(v?: string) => { password.value = v }} />,
        //             () => <TouchIDPage onNext={next} onPrev={prev} />, /*在不输入密码，或系统不支持touchID时，应该想办法跳过这个page*/
        //             () => <DBPage onNext={next} onPrev={prev} />,
        //             () => <FinishPage onFinish={onFinish} />
        //         ][page.value]()}
        //     </div>
        // </div>
    }
})

const WelcomePage = defineComponent({
    emits: ['next'],
    setup(props, { emit }) {
        return () => <>
            <h1 class="title">欢迎使用Hedge!</h1>
            <p>此向导将引导您初始化Hedge的配置，并创建第一个数据库。</p>
            <button class="button is-link absolute right-bottom mr-5 mb-5" onClick={() => emit('next')}>开始<i class="fa fa-arrow-right ml-1" /></button>
        </>
    }
})

const PasswordPage = defineComponent({
    props: {password: String},
    emits: ['next', 'updatePassword'],
    setup(props, { emit }) {
        const hasPassword = ref(true)

        const password = ref(props.password)
        const checkPassword = ref()
        
        return () => <>
            <h1 class="subtitle">设置口令</h1>
            {hasPassword.value ?
                <>
                    <p>设定登录口令，每次打开App之前都会进行验证，阻止不希望的访问。</p>
                    <div class="field mt-2">
                        <label class="label">输入口令</label>
                        <div class="control"><Input class="is-small" type="password" value={password.value} onUpdateValue={v => password.value = v}/></div>
                    </div>
                    <div class="field">
                        <label class="label">确认口令</label>
                        <div class="control"><Input class="is-small" type="password"/></div>
                    </div>
                    <a class="is-size-7" onClick={() => hasPassword.value = false}>不设置口令</a>
                </>
            :
                <>
                    <p>您选择了不设置口令。App打开时不会进行验证，允许任何访问。</p>
                    <div class="mt-4">
                        <a onClick={() => hasPassword.value = true}>设置口令</a>
                    </div>
                </>
            }
            <button class="button is-link absolute right-bottom mr-5 mb-5" onClick={() => emit('next')}>下一步<i class="fa fa-arrow-right ml-1" /></button>
        </>
    }
})

const TouchIDPage = defineComponent({
    emits: ['next', 'prev'],
    setup(props, { emit }) {
        const on = ref(false)

        return () => <>
            <h1 class="subtitle">touch ID</h1>
            <p>您的系统支持使用touch ID登录App。您可以选择开启touch ID访问，在打开App时，优先使用系统级touch ID进行验证。</p>
            <div class="has-text-centered mt-5">
                {on.value ?
                    <>
                        <i class="fa fa-3x fa-check mb-4"/>
                        <div class="is-size-6">已开启touch ID认证</div>
                        <div class="mt-2 is-size-7"><a onClick={() => on.value = false}>取消开启</a></div>
                    </>
                :
                    <>
                        <i class="fa fa-3x fa-fingerprint mb-4"/>
                        <div class="is-size-6"><a>开启touch ID认证</a></div>
                    </>
                }
            </div>
            <button class="button is-link is-light absolute left-bottom ml-5 mb-5" onClick={() => emit('prev')}><i class="fa fa-arrow-left mr-1" />上一步</button>
            <button class="button is-link absolute right-bottom mr-5 mb-5" onClick={() => emit('next')}>下一步<i class="fa fa-arrow-right ml-1" /></button>
        </>
    }
})

const DBPage = defineComponent({
    props: {filepath: String},
    emits: ['next', 'prev', 'updateFilepath'],
    setup(props, { emit }) {
        const mode: Ref<"appData" | "custom" | "disable"> = ref("appData")
        const folderInAppData = ref("default")
        const customfolderPath = ref("")

        return () => <>
            <h1 class="subtitle">创建第一个数据库</h1>
            {mode.value === "appData" ?
                <>
                    <p>Hedge以数据库为最大单位管理资料。第一个数据库默认将存放在App数据目录下。</p>
                    <div class="field mt-2">
                        <label class="label">数据库名称</label>
                        <Input class="is-small" value={folderInAppData.value} onUpdateValue={v => folderInAppData.value = v}/>
                    </div>
                </>
            : mode.value === "custom" ?
                <>
                    <p>请为第一个数据库选择自定义的存放位置。</p>
                    <div class="field is-grouped mt-5">
                        <p class="control is-expanded">
                            <Input class="is-small" value={customfolderPath.value} onUpdateValue={v => customfolderPath.value = v}/>
                        </p>
                        <p class="control">
                            <button class="button is-small is-info"><i class="fa fa-folder-open mr-1"/>选择文件夹…</button>
                        </p>
                    </div>
                </>
            :
                <div class="mb-4"><p>已选择不创建第一个数据库。稍后请自行创建。</p></div>
            }
            {mode.value !== "appData" && <p><a class="is-size-7" onClick={() => mode.value = "appData"}>在默认位置创建数据库</a></p>}
            {mode.value !== "custom" && <p><a class="is-size-7" onClick={() => mode.value = "custom"}>在自定义位置创建数据库</a></p>}
            {mode.value !== "disable" && <p><a class="is-size-7" onClick={() => mode.value = "disable"}>不创建数据库</a></p>}
            <button class="button is-link is-light absolute left-bottom ml-5 mb-5" onClick={() => emit('prev')}><i class="fa fa-arrow-left mr-1" />上一步</button>
            <button class="button is-link absolute right-bottom mr-5 mb-5" onClick={() => emit('next')}>完成<i class="fa fa-arrow-right ml-1" /></button>
        </>
    }
})

const FinishPage = defineComponent({
    emits: ['finish'],
    setup(props, { emit }) {
        const isFinished = ref(true)

        return () => <>
            <h1 class="subtitle">完成</h1>
            {isFinished ?
                <>
                    <div class="has-text-centered absolute center">
                        <i class="fa fa-3x fa-check mb-4"/>
                        <div class="is-size-6">初始化已完成。点击继续开始使用。</div>
                    </div>
                    <button class="button is-link absolute right-bottom mr-5 mb-5" onClick={() => emit('finish')}>继续<i class="fa fa-hand-peace ml-1" /></button>
                </>
            :
                <div class="has-text-centered absolute center">
                    <i class="fa fa-3x fa-spinner fa-pulse mb-4"/>
                    <div class="is-size-6">正在应用初始化设置…</div>
                </div>
            }
        </>
    }
})