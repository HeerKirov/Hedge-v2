

export type MenuTemplate = NormalMenuTemplate | CheckboxMenuTemplate | RadioMenuTemplate | SeparatorMenuTemplate | SubMenuTemplate

export type MenuTemplateInIpc = Exclude<NormalMenuTemplate, "click"> & {eventId?: number} | Exclude<CheckboxMenuTemplate, "click"> & {eventId?: number} | Exclude<RadioMenuTemplate, "click"> & {eventId?: number} | SeparatorMenuTemplate | SubMenuTemplate

export interface NormalMenuTemplate {
    label: string
    enabled?: boolean
    type: "normal"
    click?(): void
}
export interface CheckboxMenuTemplate {
    label: string
    enabled?: boolean
    type: "checkbox"
    checked?: boolean
    click?(): void
}
export interface RadioMenuTemplate {
    label: string
    enabled?: boolean
    type: "radio"
    checked?: boolean
    click?(): void
}
export interface SeparatorMenuTemplate {
    type: "separator"
}
export interface SubMenuTemplate {
    label: string
    enabled?: boolean
    type: "submenu"
    submenu: MenuTemplate[]
}
export interface Menu {
    popup(options?: {x: number, y: number}): void
}

export interface OpenDialogOptions {
    title?: string
    defaultPath?: string
    filters?: {name: string, extensions: string[]}[]
    properties?: ("openFile" | "openDirectory" | "multiSelections" | "createDirectory"/*macOS*/)[]
}

export interface MessageOptions {
    type: "none"|"info"|"error"|"question"
    buttons?: string[]
    defaultButtonId?: number
    title?: string
    message: string
    detail?: string
}
