package com.heerkirov.hedge.server.exceptions

/**
 * 当指定导入的文件不可访问时，抛出此异常。
 * 抛出位置：
 * - import从本地导入
 */
class FileNotFoundError : BadRequestException("FILE_NOT_FOUND", "Target file is not found or not accessible.")

/**
 * 当指定的文件的扩展名不受支持时，抛出此异常。
 * 抛出位置：
 * - upload/import导入时
 */
class IllegalFileExtensionError(extension: String) : BadRequestException("ILLEGAL_FILE_EXTENSION", "Extension type '$extension' is illegal.", extension)

/**
 * 当尝试保存一个还未导入完成的文件时，抛出此异常。
 * 抛出位置：
 * - save文件时
 */
class NotReadyFileError : BadRequestException("FILE_NOT_READY", "File is not ready.")

/**
 * 当parentId出现闭环时，抛出此异常。parentId为自己也构成闭环。
 * 抛出位置：
 * - 更新tag的parentId
 * - 更新topic的parentId
 */
class RecursiveParentError : BadRequestException("RECURSIVE_PARENT", "Param 'parentId' has recursive.")

/**
 * 当给出的排序顺位超出可用的范围时，抛出此异常。
 * 抛出位置：
 * - 设定album的subtitles
 * - 修改album的子项
 */
class OrdinalOutOfBoundsError(paramName: String) : BadRequestException("ORDINAL_OUT_OF_BOUNDS", "Param '$paramName': ordinal is out of bounds.", paramName)

/**
 * 当将color赋值给一个非根的tag时，抛出此异常。
 * 抛出位置：
 * - 设定tag的color
 */
class CannotGiveColorError : BadRequestException("CANNOT_GIVE_COLOR", "Cannot give 'color' for a not root tag.")

/**
 * 当参数的值违反其他关系带来的约束时，抛出此异常。
 * 抛出位置：
 * - 设定topic的type，且type与parent不适用时
 * - 更新topic的type，且type与任意children不适用时
 */
class IllegalConstraintError(paramName: String, relation: String, relationValue: Any?) : BadRequestException("ILLEGAL_CONSTRAINT", "Param '$paramName' is illegal for constraint of $relation with $paramName $relationValue.", listOf(paramName, relation, relationValue))

/**
 * 当给出的tag组中，直接存在或间接导出了具有强制属性的同一冲突组下的至少两个成员时，抛出此异常。
 * 抛出位置：
 * - 设定illust的tags时
 * @param conflictingMembers 发生冲突的组成员。外层Map指代组，内层List指代同一个组下冲突的组员。
 */
class ConflictingGroupMembersError(conflictingMembers: Map<Int, List<ConflictingMember>>) : BadRequestException("CONFLICTING_GROUP_MEMBERS",
    "Tags ${conflictingMembers.entries.joinToString { (groupId, members) -> "$groupId: [${members.joinToString { "${it.member}(${it.memberId})" }}]" }} are in same conflicting group.", conflictingMembers) {
    data class ConflictingMember(val memberId: Int, val member: String)
}

/**
 * 当regex表达式解析出现错误，且引起错误的原因大概率是编写的错误时，抛出此异常。
 * 抛出位置：
 * - 导入新的项目，且开启自动source meta解析时
 * - 调用source meta解析工具时
 */
class InvalidRegexError(regex: String, msg: String): BadRequestException("INVALID_REGEX", "Regex $regex may has some error because an exception was thrown: $msg", regex)

/**
 * 当编写的rule的index与site的规则不匹配时，抛出此异常。
 * 指secondaryId存在/不存在而与site的规则要求相反时的情况。
 * 抛出位置：
 * - 更新import rule列表时
 */
class InvalidRuleIndexError(site: String, regex: String) : BadRequestException("INVALID_RULE_INDEX", "Rule [$site] $regex has secondaryId config which not suit to site config.", listOf(site, regex))

/**
 * 当业务所需的某种选项内容不支持当前业务时，抛出此异常。
 * 抛出位置：
 * - 当使用SystemDownloadHistory解析source但未设置systemDownloadHistoryPath时
 */
class InvalidOptionError(option: String, msg: String) : BadRequestException("INVALID_OPTION", "Option '$option' is invalid: $msg", option)