import { useRoute, useRouter } from "vue-router"
import { useNavigatorManager, watchNavigatorEvent } from "./navigator-event"
import { ParentTopic } from "@/functions/adapter-http/impl/topic"
import { windowManager } from "@/functions/module/window-manager"
import { useToast } from "@/functions/module/toast"
import { date, LocalDate } from "@/utils/datetime"

export { watchNavigatorEvent }

/**
 * 一个高级导航器，提供确定的业务导航，提供特定的参数以跳转至需要的目标页面。
 * 对于拥有显式URL参数的页面，导航器使用query和param完成导航；
 * 对于没有这类参数，但仍需要提供隐式导航参数的页面，导航器使用另一个导航事件机制完成导航和参数通知，并需要页面配合处理。
 */
export interface Navigator {
    goto: Navigation
    newWindow: Navigation
}

interface Navigation {
    main: {
        illusts(options?: {topicName?: string, authorName?: string, tagName?: string})
        albums(options?: {topicName?: string, authorName?: string, tagName?: string})
        topics: {
            (options?: {parent?: ParentTopic})
            detail(topicId: number)
        }
        authors: {
            ()
            detail(topicId: number)
        }
        tags: {
            ()
            detail(tagId: number)
        }
        partitions: {
            ()
            detail(date: LocalDate)
        }
        folders: {
            ()
            detail(folderId: number)
        }
    }
    preferences: {
        image(imageId: number)
        collection(collectionId: number)
        album(albumId: number)
    }
}

export function useNavigator(): Navigator {
    const router = useRouter()
    const navigatorManager = useNavigatorManager()

    const goto: Navigation = {
        main: {
            illusts(options) {
                navigatorManager.emit("MainIllusts", options ?? {})
                router.push({name: "MainIllusts"}).finally()
            },
            albums(options) {
                navigatorManager.emit("MainAlbums", options ?? {})
                router.push({name: "MainAlbums"}).finally()
            },
            topics: complexFunction(function(options) {
                navigatorManager.emit("MainTopics", options ?? {})
                router.push({name: "MainTopics"}).finally()
            }, {
                detail(topicId: number) {
                    router.push({name: "MainTopics", query: {detail: topicId}}).finally()
                }
            }),
            authors: complexFunction(function() {
                router.push({name: "MainAuthors"}).finally()
            }, {
                detail(authorId: number) {
                    router.push({name: "MainAuthors", query: {detail: authorId}}).finally()
                }
            }),
            tags: complexFunction(function () {
                router.push({name: "MainTags"}).finally()
            }, {
                detail(tagId: number) {
                    router.push({name: "MainTags", query: {detail: tagId}}).finally()
                }
            }),
            partitions: complexFunction(function () {
                router.push({name: "MainPartitions"}).finally()
            }, {
                detail(d: LocalDate) {
                    router.push({name: "MainPartitions", query: {detail: date.toISOString(d)}}).finally()
                }
            }),
            folders: complexFunction(function () {
                router.push({name: "MainFolders"}).finally()
            }, {
                detail(folderId: number) {
                    router.push({name: "MainFolders", query: {detail: folderId}}).finally()
                }
            })
        },
        preferences: {
            image(imageId: number) {
            },
            collection(collectionId: number) {
            },
            album(albumId: number) {
            }
        }
    }

    const newWindow: Navigation = {
        main: {
            illusts(options) {
                callNewWindow("main.illusts", options)
            },
            albums(options) {
                callNewWindow("main.albums", options)
            },
            topics: complexFunction(function(options) {
                callNewWindow("main.topics", options)
            }, {
                detail(topicId: number) {
                    callNewWindow("main.topics.detail", topicId)
                }
            }),
            authors: complexFunction(function() {
                callNewWindow("main.authors")
            }, {
                detail(authorId: number) {
                    callNewWindow("main.authors.detail", authorId)
                }
            }),
            tags: complexFunction(function () {
                callNewWindow("main.tags")
            }, {
                detail(tagId: number) {
                    callNewWindow("main.tags.detail", tagId)
                }
            }),
            partitions: complexFunction(function () {
                callNewWindow("main.partitions")
            }, {
                detail(d: LocalDate) {
                    callNewWindow("main.partitions.detail", JSON.stringify(d))
                }
            }),
            folders: complexFunction(function () {
                callNewWindow("main.folders")
            }, {
                detail(folderId: number) {
                    callNewWindow("main.folders.detail", folderId)
                }
            })
        },
        preferences: {
            image(imageId: number) {
                callNewWindow("preferences.image", imageId)
            },
            collection(collectionId: number) {
                callNewWindow("preferences.collection", collectionId)
            },
            album(albumId: number) {
                callNewWindow("preferences.album", albumId)
            }
        }
    }

    const callNewWindow = (navigator: string, params?: any) => {
        windowManager.newWindow(`/?navigator=${encodeURIComponent(navigator)}&param=${encodeURIComponent(JSON.stringify(params))}`)
    }

    return {goto, newWindow}
}

export function useNavigatorAnalyzer() {
    const route = useRoute()
    const { toast } = useToast()
    const { goto } = useNavigator()

    const analyseForNewWindow = (): boolean => {
        const navigator = route.query["navigator"] as string | undefined
        const params = route.query["params"] as string | undefined
        if(navigator === undefined) {
            return false
        }
        const split = navigator.split(".")
        let target: any = goto
        for (const field of split) {
            target = target[field]
            if(target === undefined) {
                toast("跳转错误", "danger", `无法识别跳转选项${navigator}。已跳转至主页。`)
                return false
            }
        }
        const p = params !== undefined ? JSON.parse(params) : undefined

        target(p)

        return true
    }

    return {analyseForNewWindow}
}

function complexFunction<F extends Function, T extends Record<string, any>>(func: F, attach: T): F & T {
    for(const [k, v] of Object.entries(attach)) {
        func[k] = v
    }

    return <F & T>func
}
