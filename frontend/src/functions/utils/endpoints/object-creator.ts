import { Ref, ref } from "vue"
import { HttpClient, Response } from "@/functions/adapter-http"
import { BasicException } from "@/functions/adapter-http/exception"
import { useHttpClient } from "@/functions/app"
import { useToast } from "@/functions/module/toast"

interface ObjectCreator<FORM> {
    save(): Promise<boolean>
}

interface ObjectCreatorOptions<FORM, OUTPUT, RESULT, CE extends BasicException> {
    form: Ref<FORM>,
    mapForm(form: FORM): OUTPUT
    create(httpClient: HttpClient): (form: OUTPUT) => Promise<Response<RESULT, CE>>
    beforeCreate?(form: FORM): boolean | void
    afterCreate?(result: RESULT)
    handleError?: ErrorHandler<CE>
}

interface ErrorHandler<E extends BasicException> {
    (e: E): E | void
}

export function useObjectCreator<FORM, OUTPUT, RESULT, CE extends BasicException>(options: ObjectCreatorOptions<FORM, OUTPUT, RESULT, CE>): ObjectCreator<FORM> {
    const httpClient = useHttpClient()
    const toast = useToast()

    const method = options.create(httpClient)

    const creating = ref(false)

    const save = async (): Promise<boolean> => {
        if(!creating.value) {
            creating.value = true
            try {
                const form = options.form.value
                const validated = options.beforeCreate ? (options.beforeCreate(form) ?? true) : true
                if(!validated) {
                    return false
                }
                const res = await method(options.mapForm(form))
                if(res.ok) {
                    options.afterCreate?.(res.data)
                }else{
                    //首先尝试让上层处理错误，上层拒绝处理则自行处理
                    const e = options.handleError ? options.handleError(res.exception) : res.exception
                    if(e != undefined) toast.handleException(e)
                    return false
                }
            }finally{
                creating.value = false
            }
            return true
        }
        return false
    }

    return {save}
}
