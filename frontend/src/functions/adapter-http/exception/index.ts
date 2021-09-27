import { CheckedException, DaemonException, UncheckedException } from "./exceptions"
import { BaseException, InternalError, UnknownError } from "./base-exceptions"
export {
    ParamError, ParamTypeError, ParamRequired, ParamNotRequired, PasswordWrong,
    NotFound, Reject, ResourceNotExist, ResourceNotSuitable, AlreadyExists, CascadeResourceExists,
    FileNotFoundError, IllegalFileExtensionError, RecursiveParentError, CannotGiveColorError,
    IllegalConstraintError, ConflictingGroupMembersError, InvalidRegexError, InvalidRuleIndexError, InvalidOptionError
} from "./exceptions"

export type AllException =
    DaemonException |
    UncheckedException |
    CheckedException |
    InternalError |
    UnknownError

export type BasicException = BaseException<number, string, unknown>

/**
 * 异常机制阐述：
 * 每个API都存在返回异常状态的可能性。因此在response中，首先根据返回状态，将response区分为ok, BusinessError, ConnectionError三类。
 * ConnectionError通常在http client中直接抛出。接下来分类BusinessError。它分为以下几类：
 * - UncheckedException: 虽然会抛出，但不应该处理，应该在表单检查中提前发现错误。这类错误忽略不提。
 * - CheckedException: 需要前端处理的异常。这些异常需要加上类型实现写明在API声明的response中。
 * - CommonException: 包括daemon exception和internal error。虽然绝大多数API都有可能抛，但应该在最开始拦截统一处理。
 */
