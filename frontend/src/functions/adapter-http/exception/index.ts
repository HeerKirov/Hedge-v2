import { CheckedException, DaemonException, ExtendException, UncheckedException } from "@/functions/adapter-http/exception/exceptions"
import { InternalError, UnknownError } from "@/functions/adapter-http/exception/base-exceptions"

export type ExceptionCode = HttpException['code']

export type HttpException =
    DaemonException |
    UncheckedException |
    CheckedException |
    ExtendException |
    InternalError |
    UnknownError
