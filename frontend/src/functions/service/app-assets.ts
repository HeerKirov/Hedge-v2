import { clientMode } from "@/functions/adapter-ipc"
import emptyFile from "@/assets/empty-file.jpg"

const assetsURLFromClient = (path: string) => `record:///${path}`

const assetsURLFromWeb = (function () {
    //hack: 直接截获了baseUrl拼接URL而不通过http client。
    const baseUrl = process.env.NODE_ENV === 'development' ? <string>process.env.VUE_APP_BASE_URL : undefined

    return (path: string) => `${baseUrl}/web/file/${path}`
})()

export const assetsUrl = clientMode ? function (path: string | null) {
    return path != null ? assetsURLFromClient(path) : emptyFile
} : function (path: string | null) {
    return path != null ? assetsURLFromWeb(path) : emptyFile
}
