import { Ref, ref } from "vue"
import { HttpClient, Response } from "@/functions/adapter-http"
import { HttpException } from "@/functions/adapter-http/exception"
import { useHttpClient } from "@/functions/app"
import { useNotification } from "@/functions/module"

interface ObjectCreator<FORM> {
    save(): Promise<boolean>
}

interface ObjectCreatorOptions<FORM, RESULT> {
    form: Ref<FORM>,
    create(httpClient: HttpClient): (form: FORM) => Promise<Response<RESULT>>
    beforeCreate?(form: FORM): boolean | void
    afterCreate?(result: RESULT)
    handleError?(e: HttpException): HttpException | void
}

export function useObjectCreator<FORM, RESULT>(options: ObjectCreatorOptions<FORM, RESULT>): ObjectCreator<FORM> {
    const httpClient = useHttpClient()
    const notification = useNotification()

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
                const res = await method(form)
                if(res.ok) {
                    options.afterCreate?.(res.data)
                }else if(res.exception) {
                    //首先尝试让上层处理错误，上层拒绝处理则自行处理
                    const e = options.handleError ? options.handleError(res.exception) : res.exception
                    if(e != undefined) notification.handleException(e)
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
