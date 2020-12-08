package com.heerkirov.hedge.server.exceptions

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