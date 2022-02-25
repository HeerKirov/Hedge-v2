import TopBarLayout from "@/components/layouts/TopBarLayout"
import TopBarContent from "./TopBarContent"
import ListView from "./ListView"

export default function() {
    return <TopBarLayout v-slots={{
        topBar: () => <TopBarContent/>,
        default: () => <ListView/>
    }}/>
}
