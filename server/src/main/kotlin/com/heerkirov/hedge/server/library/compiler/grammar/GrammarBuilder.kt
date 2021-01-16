package com.heerkirov.hedge.server.library.compiler.grammar

import com.heerkirov.hedge.server.library.compiler.lexical.CharSequence
import com.heerkirov.hedge.server.library.compiler.lexical.Morpheme
import com.heerkirov.hedge.server.library.compiler.lexical.Space
import com.heerkirov.hedge.server.library.compiler.lexical.Symbol
import com.heerkirov.hedge.server.library.compiler.utils.GrammarError
import java.util.*
import kotlin.collections.ArrayList

/**
 * 定义一段文法。
 * 由于语法文法的定义有那么点复杂度，因此把文法的定义、优化、执行拆分开了。这里是文法的构造器。
 */
fun grammar(block: GrammarBuilder.() -> Unit) {
    val builder = GrammarBuilder()
    builder.block()
}

/**
 * 总构造器。
 */
class GrammarBuilder {
    /**
     * 定义一个新的文法节点，也就是一个非终结符。它包含名称、构成文法节点的执行单元。
     */
    fun node(name: String, block: GrammarNodeBuilder.() -> Unit) {

    }

    /**
     * 定义一个文法节点，并作为根节点。
     */
    fun rootNode(block: GrammarNodeBuilder.() -> Unit) {

    }
}

/**
 * 文法节点的构造器。
 */
class GrammarNodeBuilder {
    private val flags: MutableList<MorphemeUnit<Symbol>> = LinkedList()
    private var records: MutableList<GrammarUnit> = ArrayList(4)

    /**
     * 此节点的开始。
     */
    val start = StartUnit()

    /**
     * 此节点的结束。
     */
    val end = EndUnit()

    /**
     * 定义一个终结符单元，类型为空格。
     */
    fun space(): MorphemeUnit<Space> {
        return SpaceUnit()
    }

    /**
     * 定义一个特殊单元，类型为可选的空格。实质是定义了可选的指向单元。
     */
    fun optionalSpace(): NextGrammarUnit {
        TODO()
    }

    /**
     * 定义一个终结符单元，类型为字符。
     * @param flag 将此符号记入此文法节点的flag表。
     */
    fun symbol(symbol: String, flag: Boolean = false): MorphemeUnit<Symbol> {
        return SymbolUnit(symbol).also { if(flag) flags.add(it) }
    }

    /**
     * 定义一个终结符单元，类型为字符串。
     * @param record 将此字符串记入此文法节点的记录列表。
     */
    fun sequence(record: Boolean = false): MorphemeUnit<CharSequence> {
        return SequenceUnit().also { if(record) records.add(it) }
    }

    /**
     * 定义一个非终结符单元，也就是节点。
     * @param record 将此字符串记入此文法节点的记录列表。
     */
    fun node(nodeName: String, record: Boolean = false): NodeUnit {
        return NodeUnit(nodeName).also { if(record) records.add(it) }
    }

    /**
     * 为此单元设定它的下一个指向单元。
     */
    infix fun <U : GrammarUnit> NextGrammarUnit.next(unit: U): U {
        return unit.also { this.addNext(it) }
    }

    /**
     * 为此单元设定多项下一个的指向单元，且这些指向单元都会指向相同的下一个的目标。
     */
    fun NextGrammarUnit.next(vararg units: NextGrammarUnit): NextGrammarUnit {
        return GroupUnit(units.toList())
    }

    /**
     * 为此单元设定多项下一个的指向单元，且这些指向单元都会指向相同的下一个的目标。此外还包含当前单元在内，也就是此next指定的项可省略
     */
    fun NextGrammarUnit.optionalNext(vararg units: NextGrammarUnit): NextGrammarUnit {
        return GroupUnit(units.toList() + this)
    }

    /**
     * 当一个单元出现预设选项以外的结果时，调用此流程生成语法错误。
     */
    fun <U : GrammarUnit> NextGrammarUnit.orElse(block: () -> GrammarError) {
        //TODO
    }
}

interface GrammarUnit

interface NextGrammarUnit : GrammarUnit {
    fun addNext(unit: GrammarUnit)
}

abstract class NextGrammarUnitImpl : NextGrammarUnit {
    val next: MutableList<GrammarUnit> = LinkedList()

    override fun addNext(unit: GrammarUnit) {
        next.add(unit)
    }
}

class GroupUnit(private val groups: Collection<NextGrammarUnit>) : NextGrammarUnit {
    //TODO 重新设计group unit，以满足在unit而非next上实现group和optional的需求
    override fun addNext(unit: GrammarUnit) {
        groups.forEach { it.addNext(unit) }
    }
}

class EndUnit : GrammarUnit

class StartUnit : NextGrammarUnitImpl()

abstract class MorphemeUnit<M : Morpheme> : NextGrammarUnitImpl()

class SpaceUnit : MorphemeUnit<Space>()

class SymbolUnit(val symbol: String) : MorphemeUnit<Symbol>()

class SequenceUnit : MorphemeUnit<CharSequence>()

class NodeUnit(val nodeName: String) : NextGrammarUnitImpl()