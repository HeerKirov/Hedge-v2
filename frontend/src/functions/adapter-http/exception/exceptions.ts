import { BadRequestException, UnauthorizedException, ForbiddenException, NotFoundException } from "./base-exceptions"

export type DaemonException =
    NotInit |
    NoToken |
    TokenWrong |
    OnlyForClient |
    RemoteDisabled

export type UncheckedException =
    ParamTypeError |
    ParamError |
    ParamRequired |
    ParamNotRequired

export type CheckedException =
    NotFound |
    Reject |
    PasswordWrong |
    ResourceNotExist<string, unknown> |
    ResourceNotSuitable<string, unknown> |
    AlreadyExists<string, string, unknown> |
    CascadeResourceExists<string> |
    FileNotFoundError |
    IllegalFileExtensionError |
    ContentParseError |
    RecursiveParentError |
    CannotGiveColorError |
    IllegalConstraintError<string, string, unknown> |
    ConflictingGroupMembersError |
    InvalidRegexError |
    InvalidRuleIndexError |
    InvalidOptionError<string>

//== 背景异常：不属于详细业务异常，应该统一处理 ==

type NotInit = BadRequestException<"NOT_INIT", null>
type NoToken = UnauthorizedException<"NO_TOKEN", null>
type TokenWrong = UnauthorizedException<"TOKEN_WRONG", null>
type OnlyForClient = ForbiddenException<"ONLY_FOR_CLIENT", null>
type RemoteDisabled = ForbiddenException<"REMOTE_DISABLED", null>

//== 普通非必须异常：因为业务原因抛出的通用异常。这些异常是能通过先前检查避免的 ==

export type ParamTypeError = BadRequestException<"PARAM_TYPE_ERROR", string>
export type ParamError = BadRequestException<"PARAM_ERROR", string>
export type ParamRequired = BadRequestException<"PARAM_REQUIRED", string>
export type ParamNotRequired = BadRequestException<"PARAM_NOT_REQUIRED", string>

//== 普通异常：因为业务原因抛出的通用异常 ==

export type PasswordWrong = UnauthorizedException<"PASSWORD_WRONG", null>
export type NotFound = NotFoundException<"NOT_FOUND", null>
export type Reject = BadRequestException<"REJECT", null>
export type ResourceNotExist<P extends string, V> = BadRequestException<"NOT_EXIST", [P, V]>
export type ResourceNotSuitable<P extends string, V> = BadRequestException<"NOT_SUITABLE", [P, V]>
export type AlreadyExists<R extends string, P extends string, V> = BadRequestException<"ALREADY_EXISTS", [R, P, V]>
export type CascadeResourceExists<P extends string> = BadRequestException<"CASCADE_RESOURCE_EXISTS", P>

//== 扩展异常：因为业务原因抛出的非通用异常，这些异常用在特定的API中描述具体的事项 ==

export type FileNotFoundError = BadRequestException<"FILE_NOT_FOUND", null>
export type IllegalFileExtensionError = BadRequestException<"ILLEGAL_FILE_EXTENSION", string>
export type ContentParseError = BadRequestException<"CONTENT_PARSE_ERROR", string>
export type RecursiveParentError = BadRequestException<"RECURSIVE_PARENT", null>
export type CannotGiveColorError = BadRequestException<"CANNOT_GIVE_COLOR", null>
export type IllegalConstraintError<P extends string, R extends string, V> = BadRequestException<"ILLEGAL_CONSTRAINT", [P, R, V[]]>
export type ConflictingGroupMembersError = BadRequestException<"CONFLICTING_GROUP_MEMBERS", ConflictingMembers[]>
export type InvalidRegexError = BadRequestException<"INVALID_REGEX", string>
export type InvalidRuleIndexError = BadRequestException<"INVALID_RULE_INDEX", [string, string]>
export type InvalidOptionError<O extends string> = BadRequestException<"INVALID_OPTION", O>

interface ConflictingMembers { group: Member, force: boolean, members: Member[] }
interface Member { id: number, name: string, color: string | null, isExported: boolean }
