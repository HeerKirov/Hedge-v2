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
class IllegalFileExtensionError(extension: String) : BadRequestException("ILLEGAL_FILE_EXTENSION", "Extension type '$extension' is illegal.")

/**
 * 当parentId出现闭环时，抛出此异常。parentId为自己也构成闭环。
 * 抛出位置：
 * - 更新tag的parentId
 * - 更新topic的parentId
 */
class RecursiveParentError : BadRequestException("RECURSIVE_PARENT", "Param 'parentId' has recursive.")

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