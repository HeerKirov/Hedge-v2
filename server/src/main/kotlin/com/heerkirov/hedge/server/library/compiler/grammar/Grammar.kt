package com.heerkirov.hedge.server.library.compiler.grammar

enum class GrammarNode {
    EXPRESSION,
    EXPRESSION_ITEM,
    CONJUNCTION,
    CONJUNCT,
    SFP,
    SP,
    SUBJECT,
    FAMILY,
    UNARY_FAMILY,
    PREDICATIVE,
    OPTIONAL_SPACE,
    ELEMENT,
    ANNOTATION,
    COLLECTION,
    RANGE,
    SORTED_LIST,
    SORTED_ITEM
}

/**
 * 文法的实际定义。
 */
val grammarDefinition = grammar<GrammarNode> {
    this root node(GrammarNode.EXPRESSION) {
        start next node(GrammarNode.OPTIONAL_SPACE) next node(GrammarNode.EXPRESSION_ITEM).also { item ->
            item next space().also {
                it next item
                it next end
            }
            item next symbol("&") next item
            item next end
        }
    }

    node(GrammarNode.EXPRESSION_ITEM) {
        val conjunction = start next node(GrammarNode.CONJUNCTION).also {
            it next end
        }
        val optionalSpaceToConjunction = node(GrammarNode.OPTIONAL_SPACE) next conjunction
        val sourceSymbol = start next symbol("^", flag = true).also {
            it next optionalSpaceToConjunction
        }
        start next symbol("-", flag = true).also {
            it next optionalSpaceToConjunction
            it next node(GrammarNode.OPTIONAL_SPACE) next sourceSymbol
        }
    }

    node(GrammarNode.CONJUNCTION) {
        start next node(GrammarNode.CONJUNCT).also {
            it next end
            it next node(GrammarNode.OPTIONAL_SPACE) next symbol("|") next node(GrammarNode.OPTIONAL_SPACE) next it
        }
    }

    node(GrammarNode.CONJUNCT) {
        start next node(GrammarNode.SFP) next end
        start next node(GrammarNode.SP) next end
    }

    node(GrammarNode.SP) {
        val optionalSpaceUnit = node(GrammarNode.OPTIONAL_SPACE) next node(GrammarNode.PREDICATIVE) next end
        start next symbol(".") next optionalSpaceUnit
        start next symbol("!") next optionalSpaceUnit
        start next symbol("?") next optionalSpaceUnit
    }

    node(GrammarNode.SFP) {
        start next node(GrammarNode.SUBJECT).also {
            it next end
            it next node(GrammarNode.OPTIONAL_SPACE).also { space ->
                space next node(GrammarNode.UNARY_FAMILY) next end
                space next node(GrammarNode.FAMILY) next node(GrammarNode.OPTIONAL_SPACE) next node(GrammarNode.PREDICATIVE) next end
            }
        }
    }

    node(GrammarNode.SUBJECT) {
        start next node(GrammarNode.ELEMENT) next end
        start next node(GrammarNode.ANNOTATION) next end
    }

    node(GrammarNode.UNARY_FAMILY) {
        start next symbol("++") next end
        start next symbol("--") next end
    }

    node(GrammarNode.FAMILY) {
        start next symbol(":") next end
        start next symbol(">=") next end
        start next symbol("<=") next end
        start next symbol(">") next end
        start next symbol("<") next end
        start next symbol("~") next end
    }

    node(GrammarNode.PREDICATIVE) {
        start next node(GrammarNode.ELEMENT) next end
        start next node(GrammarNode.COLLECTION) next end
        start next node(GrammarNode.RANGE) next end
        start next node(GrammarNode.SORTED_LIST) next end
    }
    
    node(GrammarNode.OPTIONAL_SPACE) {
        start next end
        start next space() next end
    }

    node(GrammarNode.ELEMENT) {
        val string = sequence(record = true).also {
            it next end
            it next symbol(".") next it
        }
        start next string
        start next symbol("@", flag = true) next string
        start next symbol("#", flag = true) next string
        start next symbol("$", flag = true) next string
    }

    node(GrammarNode.ANNOTATION) {
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

    node(GrammarNode.COLLECTION) {
        start next symbol("{") next node(GrammarNode.OPTIONAL_SPACE).also { space1 ->
            val right = symbol("}") next end
            space1 next right
            space1 next sequence(record = true) next node(GrammarNode.OPTIONAL_SPACE).also { space2 ->
                space2 next right
                space2 next symbol(",") next space1
            }
        }
    }

    node(GrammarNode.RANGE) {
         node(GrammarNode.OPTIONAL_SPACE).also {
             start next symbol("[", flag = true) next it
             start next symbol("(", flag = true) next it
         } next sequence(record = true) next node(GrammarNode.OPTIONAL_SPACE) next symbol(",") next node(GrammarNode.OPTIONAL_SPACE) next sequence(record = true) next node(GrammarNode.OPTIONAL_SPACE).also {
             it next symbol("]", flag = true) next end
             it next symbol(")", flag = true) next end
         }
    }

    node(GrammarNode.SORTED_LIST) {
        start next node(GrammarNode.SORTED_ITEM).also {
            it next end
            it next node(GrammarNode.OPTIONAL_SPACE) next symbol(",") next node(GrammarNode.OPTIONAL_SPACE) next it
        }
    }

    node(GrammarNode.SORTED_ITEM) {
        sequence(record = true).also {
            start next it
            start next symbol("+", flag = true) next it
            start next symbol("-", flag = true) next it
        } next end
    }
}