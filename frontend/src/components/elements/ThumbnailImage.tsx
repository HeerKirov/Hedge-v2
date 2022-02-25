import { assetsUrl } from "@/services/app"
import style from "./ThumbnailImage.module.scss"

/**
 * 以缩略图形式显示的单张img。特征是contain模式、有边框、有最大高度。
 */
export default function(props: {
    value?: string | null,
    alt?: string,
    numTagValue?: number,
    minHeight?: string,
    maxHeight?: string
}) {
    return <div class={style.thumbnailImage}>
        <img src={assetsUrl(props.value ?? null)} alt={props.alt} style={{"minHeight": props.minHeight ?? "4rem", "maxHeight": props.maxHeight ?? "12rem"}}/>
        {props.numTagValue !== undefined && <span class={[style.numTag, "tag", "is-dark"]}><i class="fa fa-images"/>{props.numTagValue}</span>}
    </div>
}

