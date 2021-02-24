import { BadRequestException, UnauthorizedException, ForbiddenException, NotFoundException } from "@/functions/adapter-http/exception/base-exceptions"

export type DaemonException =
    NotInit |
    NoToken |
    TokenWrong |
    OnlyForWeb |
    OnlyForClient |
    RemoteDisabled |
    PasswordWrong

export type UncheckedException =
    ParamTypeError |
    ParamError |
    ParamRequired |
    ParamNotRequired

export type CheckedException =
    NotFound |
    Reject |
    ResourceNotExist |
    ResourceNotSuitable |
    ResourceDuplicated |
    AlreadyExists |
    CascadeResourceExists

export type ExtendException =
    FileNotFoundError |
    IllegalFileExtensionError |
    RecursiveParentError |
    OrdinalOutOfBoundsError |
    CannotGiveColorError |
    IllegalConstraintError |
    ConflictingGroupMembersError |
    InvalidRegexError |
    InvalidRuleIndexError |
    InvalidOptionError

type Value = string | number | boolean

//== 背景异常：不属于详细业务异常，应该统一处理 ==

type NotInit = BadRequestException<"NOT_INIT", null>
type NoToken = UnauthorizedException<"NO_TOKEN", null>
type TokenWrong = UnauthorizedException<"TOKEN_WRONG", null>
type OnlyForWeb = ForbiddenException<"ONLY_FOR_WEB", null>
type OnlyForClient = ForbiddenException<"ONLY_FOR_CLIENT", null>
type RemoteDisabled = ForbiddenException<"REMOTE_DISABLED", null>
type PasswordWrong = UnauthorizedException<"PASSWORD_WRONG", null>

//== 普通非必须异常：因为业务原因抛出的通用异常。这些异常是能通过先前检查避免的 ==

type ParamTypeError = BadRequestException<"PARAM_TYPE_ERROR", string>
type ParamError = BadRequestException<"PARAM_ERROR", string>
type ParamRequired = BadRequestException<"PARAM_REQUIRED", string>
type ParamNotRequired = BadRequestException<"PARAM_NOT_REQUIRED", string>

//== 普通异常：因为业务原因抛出的通用异常 ==

type NotFound = NotFoundException<"NOT_FOUND", null>
type Reject = BadRequestException<"REJECT", null>
type ResourceNotExist = BadRequestException<"NOT_EXIST", [string, undefined | Value | Value[]]>
type ResourceNotSuitable = BadRequestException<"NOT_SUITABLE", [string, undefined | Value | Value[]]>
type ResourceDuplicated = BadRequestException<"DUPLICATED", [string, Value[]]>
type AlreadyExists = BadRequestException<"ALREADY_EXISTS", [string, string, Value]>
type CascadeResourceExists = BadRequestException<"CASCADE_RESOURCE_EXISTS", string>

//== 扩展异常：因为业务原因抛出的非通用异常，这些异常用在特定的API中描述具体的事项 ==

type FileNotFoundError = NotFoundException<"FILE_NOT_FOUND", null>
type IllegalFileExtensionError = NotFoundException<"ILLEGAL_FILE_EXTENSION", string>
type RecursiveParentError = NotFoundException<"RECURSIVE_PARENT", null>
type OrdinalOutOfBoundsError = NotFoundException<"ORDINAL_OUT_OF_BOUNDS", string>
type CannotGiveColorError = NotFoundException<"CANNOT_GIVE_COLOR", null>
type IllegalConstraintError = NotFoundException<"ILLEGAL_CONSTRAINT", [string, string, Value | null]>
type ConflictingGroupMembersError = NotFoundException<"CONFLICTING_GROUP_MEMBERS", {[groupId: number]: {memberId: number, member: string}[]}>
type InvalidRegexError = NotFoundException<"INVALID_REGEX", string>
type InvalidRuleIndexError = NotFoundException<"INVALID_RULE_INDEX", [string, string]>
type InvalidOptionError = NotFoundException<"INVALID_OPTION", string>