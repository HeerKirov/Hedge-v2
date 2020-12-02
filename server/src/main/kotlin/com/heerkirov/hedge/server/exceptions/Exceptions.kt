package com.heerkirov.hedge.server.exceptions

//== 基础错误类型 ==

/**
 * 输入存在错误。
 */
abstract class BadRequestException(code: String, message: String, info: Any? = null) : BaseException(400, code, message, info)

/**
 * 要求附带登录认证。
 */
abstract class UnauthorizedException(code: String, message: String, info: Any? = null) : BaseException(401, code, message, info)

/**
 * 当前登录认证的权限不足以访问。
 */
abstract class ForbiddenException(code: String, message: String, info: Any? = null) : BaseException(403, code, message, info)

/**
 * 找不到当前的主体资源。
 */
abstract class NotFoundException(code: String, message: String, info: Any? = null) : BaseException(404, code, message, info)

//== 在此基础上扩展的通用错误类型 ==

/**
 * 表单参数的类型错误。
 */
open class ParamTypeError(paramName: String, reason: String) : BadRequestException("PARAM_TYPE_ERROR", "Param '$paramName' $reason"), Unchecked

/**
 * 表单参数的值错误。
 */
open class ParamError(paramName: String) : BadRequestException("PARAM_ERROR", "Param '$paramName' has incorrect value.", listOf(paramName)), Unchecked

/**
 * 表单参数的值空缺，但是业务需要这个值。
 */
open class ParamRequired(paramName: String) : BadRequestException("PARAM_REQUIRED", "Param '$paramName' is required.", listOf(paramName)), Unchecked

/**
 * 表单参数选取的某种目标资源并不存在，因此业务无法进行。
 */
open class ResourceNotExist : BadRequestException, Unchecked {
    /**
     * 指明是一项属性的目标资源。
     */
    constructor(prop: String) : super("NOT_EXIST", "Resource of $prop is not exist.", listOf(prop))
    /**
     * 指明是一项属性的目标资源。同时指明具体的值。
     */
    constructor(prop: String, value: Any) : super("NOT_EXIST", "Resource of $prop '$value' is not exist.", listOf(prop, value))
}

/**
 * 表单参数选取的某种目标资源在当前业务中不可用，因此业务无法进行。
 */
open class ResourceNotAvailable : BadRequestException, Unchecked {
    /**
     * 指明是一项属性的目标资源。
     */
    constructor(prop: String) : super("NOT_AVAILABLE", "Resource of $prop is not available.", listOf(prop))
    /**
     * 指明是一项属性的目标资源。同时指明具体的值。
     */
    constructor(prop: String, value: Any) : super("NOT_AVAILABLE", "Resource of $prop '$value' is not available.", listOf(prop, value))
}

/**
 * 表单的某种目标资源已经存在，因此业务无法进行。
 */
open class AlreadyExists : BadRequestException {
    /**
     * 指定资源名称、资源属性、属性值。
     */
    constructor(resource: String, prop: String, value: Any) : super("ALREADY_EXISTS", "$resource with $prop '$value' is already exists.", listOf(resource, prop, value))
    /**
     * 只指定资源名称。
     */
    constructor(resource: String) : super("ALREADY_EXISTS", "$resource is already exists.", listOf(resource))
}

/**
 * API的操作或一部分操作，因为某种原因拒绝执行。
 */
open class Reject(message: String): BadRequestException("REJECT", message)

/**
 * 由于服务尚未初始化，API不能被调用。
 */
open class NotInit: BadRequestException("NOT_INIT", "Server is not initialized.")

/**
 * 在headers中没有发现任何token，然而此API需要验证。或者token无法被正确解析。
 */
class NoToken : UnauthorizedException("NO_TOKEN", "No available token.")

/**
 * 使用的token是错误的，无法将其与任何token认证匹配。
 */
class TokenWrong : UnauthorizedException("TOKEN_WRONG", "Token is incorrect.")

/**
 * 使用的password是错误的。
 */
class PasswordWrong : UnauthorizedException("PASSWORD_WRONG", "Password is incorrect.")

/**
 * 此API只能在web端调用。
 */
class OnlyForWeb : ForbiddenException("ONLY_FOR_WEB", "This API can only be called from web.")

/**
 * 此API只能在客户端调用。
 */
class OnlyForClient : ForbiddenException("ONLY_FOR_CLIENT", "This API can only be called from client.")

/**
 * 此token只能由localhost使用。
 */
class RemoteDisabled : ForbiddenException("REMOTE_DISABLED", "This Token can only be used in localhost.")

/**
 * 当前主体资源未找到。
 */
class NotFound(resourceName: String? = null) : NotFoundException("NOT_FOUND", "${resourceName ?: "Resource"} not found.")
