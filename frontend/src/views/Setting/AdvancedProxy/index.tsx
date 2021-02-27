import { defineComponent, ref, watch } from "vue"
import { useSettingProxy } from "@/functions/server-api/setting"
import { usePropertySot } from "@/functions/utils/setter-property"
import Input from "@/components/Input"

export default defineComponent({
    setup() {
        const { loading, data } = useSettingProxy()

        const [ s5, s5Sot, setS5, saveS5 ] = usePropertySot(ref(data.value?.socks5Proxy ?? ""),
            () => data.value?.socks5Proxy,
            newValue => newValue ?? "",
            v => data.value!.socks5Proxy = v || null)

        const [ http, httpSot, setHttp, saveHttp ] = usePropertySot(ref(data.value?.httpProxy ?? ""),
            () => data.value?.httpProxy,
            newValue => newValue ?? "",
            v => data.value!.httpProxy = v || null)

        return () => loading.value ? <div/> : <div>
            <p class="mb-1 is-size-medium">代理选项</p>
            <p class="is-size-7 has-text-grey">设置Hedge对外网络访问的代理服务器。</p>
            <label class="label mt-2">HTTP代理</label>
            <div class="group">
                <Input class="is-width-large" placeholder="http://" value={http.value} onUpdateValue={setHttp} refreshOnInput={true}/>
                {httpSot.value && <button class="button square is-info" onClick={saveHttp}><span class="icon"><i class="fa fa-save"/></span></button>}
            </div>
            <label class="label">SOCKS5代理</label>
            <div class="group">
                <Input class="is-width-large" placeholder="socks5://" value={s5.value} onUpdateValue={setS5} refreshOnInput={true}/>
                {s5Sot.value && <button class="button square is-info" onClick={saveS5}><span class="icon"><i class="fa fa-save"/></span></button>}
            </div>
        </div>
    }
})