import { defineComponent, inject, InjectionKey, provide, Ref, ref } from "vue"
import DialogBox from "@/layouts/layouts/DialogBox"
import { AddToAlbumContent, AddToAlbumInjectionContext } from "./AddToAlbum"
import { AddToFolderContent, AddToFolderInjectionContext } from "./AddToFolder"
import { AddToCollectionContent, AddToCollectionInjectionContext } from "./AddToCollection"
import { CreatingAlbumContent, CreatingAlbumInjectionContext } from "./CreatingAlbum"
import { CreatingCollectionContent, CreatingCollectionInjectionContext } from "./CreatingCollection"
import { CloneImageContent, CloneImageInjectionContext } from "./CloneImage"
import { EditMetaTagContent, EditMetaTagInjectionContext } from "./EditMetaTag"
import { EditSourceContent, EditSourceImageInjectionContext } from "./EditSource"

interface InjectionContextMap {
    addToAlbum: AddToAlbumInjectionContext
    addToFolder: AddToFolderInjectionContext
    addToCollection: AddToCollectionInjectionContext
    creatingAlbum: CreatingAlbumInjectionContext
    creatingCollection: CreatingCollectionInjectionContext
    editSourceImage: EditSourceImageInjectionContext
    editMetaTag: EditMetaTagInjectionContext
    cloneImage: CloneImageInjectionContext
}

interface InjectionContextTemplate<T extends keyof InjectionContextMap> { type: T, context: InjectionContextMap[T] }

type InjectionContext =
    | InjectionContextTemplate<"addToAlbum">
    | InjectionContextTemplate<"addToFolder">
    | InjectionContextTemplate<"addToCollection">
    | InjectionContextTemplate<"creatingAlbum">
    | InjectionContextTemplate<"creatingCollection">
    | InjectionContextTemplate<"editSourceImage">
    | InjectionContextTemplate<"editMetaTag">
    | InjectionContextTemplate<"cloneImage">

const contextMap = {
    addToAlbum: AddToAlbumContent,
    addToFolder: AddToFolderContent,
    addToCollection: AddToCollectionContent,
    creatingAlbum: CreatingAlbumContent,
    creatingCollection: CreatingCollectionContent,
    editSourceImage: EditSourceContent,
    editMetaTag: EditMetaTagContent,
    cloneImage: CloneImageContent
}

export function installDialogServiceContext() {
    provide(dialogInjection, ref(null))
}

export function useDialogServiceContext() {
    const allContext = inject(dialogInjection)!
    return {
        allContext,
        push(newContext: InjectionContext) {
            if(allContext.value !== null) {
                allContext.value.context["cancel"]?.()
            }
            allContext.value = newContext
        }
    }
}

export function useDialogSelfContext<T extends keyof InjectionContextMap>(type: T): InjectionContextMap[T] {
    const { allContext } = useDialogServiceContext()
    const c = allContext.value
    if(c !== null) {
        if(c.type === type) {
            return c.context as InjectionContextMap[T]
        }
    }
    throw new Error("Cannot get self context.")
}

export const DialogService = defineComponent({
    setup() {
        const context = inject(dialogInjection)!

        const close = () => {
            context.value?.context["cancel"]?.()
            context.value = null
        }

        return () => <DialogBox visible={context.value !== null} onClose={close} v-slots={{
            default() {
                const Content = contextMap[context.value!.type]
                return <Content onClose={close}/>
            }
        }}/>
    }
})

const dialogInjection: InjectionKey<Ref<InjectionContext | null>> = Symbol()
