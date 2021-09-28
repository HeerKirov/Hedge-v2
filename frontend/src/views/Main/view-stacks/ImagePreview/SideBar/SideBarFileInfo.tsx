import { defineComponent } from "vue"
import { assetsUrl } from "@/functions/app"
import { numbers } from "@/utils/primitives"
import { datetime } from "@/utils/datetime"
import { usePreviewContext, useFileInfoEndpoint } from "../inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { detail: { target } } = usePreviewContext()
        const fileInfo = useFileInfoEndpoint()

        return () => <div class={style.fileInfoPanel}>
            {target.value !== null && <div class={style.thumbnail}>
                <img src={assetsUrl(target.value.thumbnailFile)} alt="thumbnail image"/>
            </div>}
            {fileInfo.data.value !== null && <>
                <div class="can-be-selected mt-1">{fileInfo.data.value.file}</div>
                <Extension class="mt-2" extension={fileInfo.data.value.extension}/>
                <FileSize class="mt-1" size={fileInfo.data.value.size} thumbnailSize={fileInfo.data.value.thumbnailSize}/>
                <Resolution class="mt-1" width={fileInfo.data.value.resolutionWidth} height={fileInfo.data.value.resolutionHeight}/>
                <p class="mt-2 has-text-grey">创建时间 {datetime.toSimpleFormat(fileInfo.data.value.createTime)}</p>
            </>}
        </div>
    }
})

function Extension(props: {extension: string}) {
    const { name, icon } = EXTENSIONS[props.extension] ?? {name: `未知类型${props.extension.toUpperCase()}`, icon: "question"}
    return <div>
        <span class="mr-2"><i class={`fa fa-${icon}`}/></span>{name}
    </div>
}

const EXTENSIONS = {
    "jpg": {name: "JPEG图像", icon: "image"},
    "jpeg": {name: "JPEG图像", icon: "image"},
    "png": {name: "PNG图像", icon: "image"},
    "gif": {name: "GIF动态图像", icon: "image"},
    "mp4": {name: "MP4视频", icon: "video"},
    "webm": {name: "WEBM视频", icon: "video"},
    "ogv": {name: "OGV视频", icon: "video"}
}

function FileSize({ size, thumbnailSize }: {size: number, thumbnailSize: number | null}) {
    return <div>
        <span class="icon mr-2"><i class="fa fa-database"/></span>
        <span class="can-be-selected mr-1">{numbers.toBytesDisplay(size)}</span>
        {thumbnailSize !== null && <>
            (缩略图
            <span class="ml-1 can-be-selected">{numbers.toBytesDisplay(thumbnailSize)}</span>
            )
        </>}
    </div>
}

function Resolution({ width, height }: {width: number, height: number}) {
    return <div>
        <span class="mr-2"><i class="fa fa-bullseye"/></span>
        <span class="can-be-selected">{width} x {height}</span>
    </div>
}
