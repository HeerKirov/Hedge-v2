import { CheckedException, DaemonException, ExtendException, UncheckedException } from "./exceptions"
import { InternalError, UnknownError } from "./base-exceptions"

export type ExceptionCode = HttpException['code']

export type HttpException =
    DaemonException |
    UncheckedException |
    CheckedException |
    ExtendException |
    InternalError |
    UnknownError
