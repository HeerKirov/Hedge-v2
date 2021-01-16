package com.heerkirov.hedge.server.library.compiler.grammar

const val EXPRESSION_ITEM = "expressionItem"
const val CONJUNCTION = "conjunction"
const val CONJUNCT = "conjunct"
const val SFP = "SFP"
const val SP = "SP"
const val SUBJECT = "subject"
const val FAMILY = "family"
const val UNARY_FAMILY = "unaryFamily"
const val PREDICATIVE = "predicative"
const val ELEMENT = "element"
const val ANNOTATION = "annotation"
const val COLLECTION = "collection"
const val RANGE = "range"
const val SORTED_LIST = "sortedList"
const val SORTED_ITEM = "sortedItem"

/**
 * 文法的实际定义。
 */
val grammarDefinition = grammar {
    rootNode {
        start next node(EXPRESSION_ITEM).also {
            it next space() next it
            it next symbol("&") next it
        } next end
    }

    node(EXPRESSION_ITEM) {
        val conjunction = start next node(CONJUNCTION).also {
            it next end
        }
        val optionalSpaceToConjunction = optionalSpace() next conjunction
        val sourceSymbol = start next symbol("^", flag = true).also {
            it next optionalSpaceToConjunction
        }
        start next symbol("-", flag = true).also {
            it next optionalSpaceToConjunction
            it next optionalSpace() next sourceSymbol
        }
    }

    node(CONJUNCTION) {
        start next node(CONJUNCT).also {
            it next end
            it next optionalSpace() next symbol("|") next optionalSpace() next it
        }
    }

    node(CONJUNCT) {
        start next node(SFP) next end
        start next node(SP) next end
    }

    node(SP) {
        val optionalSpaceUnit = optionalSpace() next node(PREDICATIVE) next end
        start next symbol(".") next optionalSpaceUnit
        start next symbol("!") next optionalSpaceUnit
        start next symbol("?") next optionalSpaceUnit
    }

    node(SFP) {
        start next node(SUBJECT).also {
            it next end
            it next optionalSpace().also { space ->
                space next node(UNARY_FAMILY) next end
                space next node(FAMILY) next optionalSpace() next node(PREDICATIVE) next end
            }
        }
    }

    node(SUBJECT) {
        start next node(ELEMENT) next end
        start next node(ANNOTATION) next end
    }

    node(UNARY_FAMILY) {
        start next symbol("++") next end
        start next symbol("--") next end
    }

    node(FAMILY) {
        start next symbol(":") next end
        start next symbol(">=") next end
        start next symbol("<=") next end
        start next symbol(">") next end
        start next symbol("<") next end
        start next symbol("~") next end
    }

    node(PREDICATIVE) {
        start next node(ELEMENT) next end
        start next node(COLLECTION) next end
        start next node(RANGE) next end
        start next node(SORTED_LIST) next end
    }

    node(ELEMENT) {
        val string = sequence(record = true).also {
            it next end
            it next symbol(".") next it
        }
        start next string
        start next symbol("@", flag = true) next string
        start next symbol("#", flag = true) next string
        start next symbol("$", flag = true) next string
    }

    node(ANNOTATION) {
        start next symbol("[").also { left ->
            val string = left next sequence(record = true).also {
                it next symbol("]") next end
            }
            left next symbol("@", flag = true).also { at1 ->
                at1 next string
                at1 next symbol("#", flag = true).also { pound2 ->
                    pound2 next string
                    pound2 next symbol("$", flag = true) next string
                }
                at1 next symbol("$", flag = true).also { dollar2 ->
                    dollar2 next string
                    dollar2 next symbol("#", flag = true) next string
                }
            }
            left next symbol("#", flag = true).also { pound1 ->
                pound1 next string
                pound1 next symbol("@", flag = true).also { at2 ->
                    at2 next string
                    at2 next symbol("$", flag = true) next string
                }
                pound1 next symbol("$", flag = true).also { dollar2 ->
                    dollar2 next string
                    dollar2 next symbol("@", flag = true) next string
                }
            }
            left next symbol("$", flag = true).also { dollar1 ->
                dollar1 next string
                dollar1 next symbol("@", flag = true).also { at2 ->
                    at2 next string
                    at2 next symbol("#", flag = true) next string
                }
                dollar1 next symbol("#", flag = true).also { pound2 ->
                    pound2 next string
                    pound2 next symbol("@", flag = true) next string
                }
            }
        }
    }

    node(COLLECTION) {
        start next symbol("{") next optionalSpace().also { space1 ->
            val right = symbol("}") next end
            space1 next right
            space1 next sequence(record = true) next optionalSpace().also { space2 ->
                space2 next right
                space2 next symbol(",") next space1
            }
        }
    }

    node(RANGE) {
        start next symbol("[")
    }
}