import { inject } from 'vue'
import { OpenDialogOptions } from "../adapter-ipc/client"
import { BasicComponentInjection } from "./install"

export function useOpenDialog(options: OpenDialogOptions) {
    const { clientMode, remote } = inject(BasicComponentInjection)!
    if(!clientMode) {
        return {
            open(): Promise<string[] | null> {
                throw new Error("Dialog is disabled in web.")
            }
        }
    }

    const open = (): Promise<string[] | null> => remote.dialog.openDialog(options)

    return {open}
}