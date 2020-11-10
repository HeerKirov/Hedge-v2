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
 * 表单参数的值错误。
 */
open class ParamError(paramName: String) : BadRequestException("PARAM_ERROR", "Param '$paramName' has incorrect value."), Unchecked

/**
 * 表单参数的值空缺，但是业务需要这个值。
 */
open class ParamRequired(paramName: String) : BadRequestException("PARAM_ERROR", "Param '$paramName' is required."), Unchecked

/**
 * 表单中选取的某种目标资源并不存在，因此业务无法进行。
 */
open class NotExist(objectName: String) : BadRequestException("NOT_EXIST", "$objectName is not exist.")

/**
 * 表单中指定的某种目标资源已经存在，因此业务无法进行。
 */
open class AlreadyExist(objectName: String) : BadRequestException("ALREADY_EXIST", "$objectName is already exist.")

/**
 * API的操作或一部分操作，因为某种原因拒绝执行。
 */
open class Reject(message: String): BadRequestException("REJECT", message)

/**
 * 在headers中没有发现任何token，然而此API需要验证。或者token无法被正确解析。
 */
class NoToken : UnauthorizedException("NO_TOKEN", "No token in headers.")

/**
 * 使用的token是错误的，无法将其与任何token认证匹配。
 */
class TokenWrong : UnauthorizedException("TOKEN_WRONG", "This token is incorrect.")

/**
 * 此API只能在web端调用。
 */
class OnlyForWeb : ForbiddenException("ONLY_FOR_WEB", "This API can only be called from web.")

/**
 * 此API只能在客户端调用。
 */
class OnlyForClient : ForbiddenException("ONLY_FOR_CLIENT", "This API can only be called from client.")

/**
 * 当前主体资源未找到。
 */
class NotFound(resourceName: String? = null) : NotFoundException("NOT_FOUND", "${resourceName ?: "Resource"} not found.")
