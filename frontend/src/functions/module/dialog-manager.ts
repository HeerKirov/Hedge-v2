import { clientMode, OpenDialogOptions, remote } from "@/functions/adapter-ipc"


export interface DialogManager {
    openDialog(options: OpenDialogOptions): Promise<string[] | null>
}

export const dialogManager = clientMode ? {
    async openDialog(options: OpenDialogOptions): Promise<string[] | null> {
        const res = await remote.dialog.openDialog(options)
        return res && res.length ? res : null
    }
} : {
    async openDialog(options: OpenDialogOptions): Promise<string[] | null> {
        //FUTURE: 在web dialog module完成后，提供web模式下的dialog支持。
        throw new Error("openDialog() cannot only be used in client mode.")
    }
}
