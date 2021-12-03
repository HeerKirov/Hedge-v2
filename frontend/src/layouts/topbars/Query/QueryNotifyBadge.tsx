import { SetupContext } from "vue"
import { QueryRes } from "@/functions/adapter-http/impl/utils-query"

export default function ({ schema }: {schema: QueryRes | undefined}, { emit }: SetupContext<{ click() }>) {
    return (schema && (schema.warnings.length || schema.errors.length)) ? <button class="button is-small is-white" onClick={() => emit("click")}>
        <i class="fa fa-exclamation has-text-danger mr-1"/>
        <span class="mr-2">{schema.errors.length}</span>
        <i class="fa fa-exclamation has-text-warning mr-1"/>
        <span>{schema.warnings.length}</span>
    </button> : null
}
