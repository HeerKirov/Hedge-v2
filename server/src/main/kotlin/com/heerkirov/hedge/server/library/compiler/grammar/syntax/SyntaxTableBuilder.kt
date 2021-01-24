package com.heerkirov.hedge.server.library.compiler.grammar.syntax

import com.heerkirov.hedge.server.library.compiler.grammar.expression.*

/**
 * 执行将文法产生式编译为语法分析表的过程。
 */
object SyntaxTableBuilder {
    /**
     * 给出一组文法产生式。构造一张语法分析表。
     */
    fun <T : Enum<T>> parse(originExpressions: List<Expression<T>>): SyntaxTable<T> {
        //添加一条根产生式S' -> S
        val rootExpression = SyntaxExpression(0, null, listOf(NonTerminalItem(originExpressions.first().key)))
        //构建全部产生式
        val expressions = listOf(rootExpression) + originExpressions.mapIndexed { i, (key, sequence) -> SyntaxExpression(i + 1, key, sequence) }
        //1. 首先，需要构造增广文法的自动机。
        val states = FamilyBuilder(expressions).parse()
        //2. 得到自动机后，使用自动机构造分析表。
        val follows = follow(expressions)
        return buildSyntaxTable(states, follows)
    }

    /**
     * 从自动机构建词法分析表。
     */
    private fun <T : Enum<T>> buildSyntaxTable(states: List<SyntaxItemState<T>>, follows: Map<T, Set<TerminalItem<T, *>>>): SyntaxTable<T> {
        val action = HashMap<Int, HashMap<TerminalItem<T, *>, Command>>()
        val goto = HashMap<Int, HashMap<T, Int>>()

        fun setAction(state: Int, key: TerminalItem<T, *>, value: Command) {
            val map = action.computeIfAbsent(state) { HashMap() }
            if(key in map) throw RuntimeException("Conflict command in ($state, ACTION[$key]), new value is $value but ${map[key]} exists.")
            map[key] = value
        }
        fun setGoto(state: Int, nonTerminalSymbol: T, gotoState: Int) {
            goto.computeIfAbsent(state) { HashMap() }[nonTerminalSymbol] = gotoState
        }

        for (state in states) {
            //goto记录的状态转移信息进行代换
            for ((i, a) in state.goto) {
                if(i is TerminalItem<*, *>) {
                    //终结符转换为ACTION表的shift操作
                    setAction(state.index, i as TerminalItem<T, *>, Command(CommandType.SHIFT, a))
                }else{
                    //非终结符转换为GOTO表的状态值
                    setGoto(state.index, (i as NonTerminalItem<T>).productionKey, a)
                }
            }
            //如果状态包含A -> å·，那么将FOLLOW(A)中的所有a，设GOTO[i, a] = reduce A -> å
            state.set.asSequence().filter { it.expression.isNotRoot() && it.isAtEnd() }.forEach {
                for (terminalItem in follows[it.expression.key]!!) {
                    setAction(state.index, terminalItem, Command(CommandType.REDUCE, it.expression.index))
                }
            }
            //如果状态包含S' -> S·，那么它可以由EOF accept
            if(state.set.any { it.expression.isRoot() && it.isAtEnd() }) setAction(state.index, EOFItem(), Command(CommandType.ACCEPT, 0))
        }

        return SyntaxTable(states.size, action, goto)
    }

    /**
     * 根据文法产生式，推导每一个非终结符的FOLLOW集合。
     */
    private fun <T : Enum<T>> follow(expressions: List<SyntaxExpression<T>>): Map<T, Set<TerminalItem<T, *>>> {
        val firstSets = first(expressions)
        val follows = HashMap<T, MutableSet<TerminalItem<T, *>>>()
        val notRootExpressions = expressions.filter { it.isNotRoot() }
        //获得开始符号。这不是追加的开始符号，而是真实定义的开始符号
        val rootKey = (expressions.first { it.isRoot() }.sequence.first() as NonTerminalItem<T>).productionKey
        //把EOF放入开始符号的FOLLOW集合中
        val eof = EOFItem<T>()
        follows[rootKey] = mutableSetOf(eof)

        while (true) {
            var changed = false
            fun addToSet(key: T, set: Collection<TerminalItem<T, *>>) {
                if(follows.computeIfAbsent(key) { mutableSetOf() }.addAll(set)) changed = true
            }
            for (expression in notRootExpressions) {
                expression.sequence.asSequence()
                    .windowed(2, 1, partialWindows = true)
                    .map { it[0] to it.getOrNull(1) }
                    .forEach { (item, nextItem) ->
                    if(item is NonTerminalItem<*>) {
                        //对于产生式A -> å B N (B为非终结符)，FIRST(N) - {∑}都加入FOLLOW(B)
                        //而如果B是产生式的最后一个文法符号，或FIRST(N)包含{∑}，那么FOLLOW(A)都加入FOLLOW(B)
                        val itemKey = (item as NonTerminalItem<T>).productionKey
                        if(nextItem == null) {
                            follows[expression.key]?.let { addToSet(itemKey, it) }
                        }else{
                            //非终结符的FIRST从集合取；终结符的FIRST只包含它自身
                            val firstN = if(nextItem is NonTerminalItem<*>) firstSets[nextItem.productionKey]!! else setOf(nextItem as TerminalItem<T, *>)
                            if(eof in firstN) {
                                follows[expression.key]?.let { addToSet(itemKey, it) }
                                addToSet(itemKey, firstN - eof)
                            }else{
                                addToSet(itemKey, firstN)
                            }
                        }
                    }
                }
            }
            if(!changed) break
        }

        return follows
    }

    /**
     * 根据文法产生式，推导每一个非终结符的FIRST集合。
     */
    private fun <T : Enum<T>> first(expressions: List<SyntaxExpression<T>>): Map<T, Set<TerminalItem<T, *>>> {
        val expressionKeyMap = expressions.filter { it.isNotRoot() }.groupBy { it.key }
        val sets = HashMap<T, MutableSet<TerminalItem<T, *>>>()
        val emptyItem = EmptyItem<T>()

        while (true) {
            var changed = false
            fun addToSet(key: T, set: Collection<TerminalItem<T, *>>) {
                if(sets.computeIfAbsent(key) { mutableSetOf() }.addAll(set)) changed = true
            }
            //遍历所有的产生式
            for ((key, syntaxExpressions) in expressionKeyMap) {
                for (syntaxExpression in syntaxExpressions) {
                    //对于产生式 key -> syntaxExpression，依次取每个文法符号
                    var breaks = false
                    for (expressionItem in syntaxExpression.sequence) {
                        //从第一个文法符号Y1开始，将FIRST(Y1)的内容都加入FIRST(KEY)
                        val firstY = if(expressionItem is NonTerminalItem<*>) {
                            //如果Y是终结符，那么从sets取FIRST集合。如果取不到，认为还没有遍历，因此暂时跳过当前产生式
                            sets[expressionItem.productionKey] ?: break
                        }else{
                            //如果Y是终结符，那么FIRST(Y)仅包含它自身
                            setOf(expressionItem as TerminalItem<T, *>)
                        }
                        addToSet(key, firstY)
                        //如果FIRST(Y1)包含∑，则继续向后考虑Y2。否则终止这条产生式，不再继续考虑
                        if(emptyItem !in firstY) {
                            breaks = true
                            break
                        }
                    }
                    if(!breaks) {
                        //没有被break，代表产生式的每个文法符号的FIRST集都包含。这种情况下把∑加入FIRST(Y)
                        addToSet(key, setOf(emptyItem))
                    }
                }
            }
            if(!changed) break
        }

        return sets
    }
}

data class Command(val type: CommandType, val num: Int) {
    override fun toString(): String = when (type) {
        CommandType.SHIFT -> String.format("s%-2d", num)
        CommandType.REDUCE -> String.format("r%-2d", num)
        CommandType.ERROR -> String.format("e%-2d", num)
        CommandType.ACCEPT -> "acc"
    }
}

enum class CommandType {
    SHIFT, REDUCE, ERROR, ACCEPT
}

class SyntaxTable<T : Enum<T>> internal constructor(stateCount: Int, action: Map<Int, Map<TerminalItem<T, *>, Command>>, goto: Map<Int, Map<T, Int>>) {
    private val terminals: Map<TerminalItem<T, *>, Int>
    private val nonTerminals: Map<T, Int>
    private val actionTable: List<List<Command?>>
    private val gotoTable: List<List<Int?>>

    init {
        //提取action中所有的终结符，将它们排列一下，并给出编号
        val terminals = action.values.asSequence().map { it.keys }.flatten().toSet().toList().mapIndexed { i, item -> item to i }
        //提取goto中的所有非终结符
        val nonTerminals = goto.values.asSequence().map { it.keys }.flatten().toSet().toList().mapIndexed { i, item -> item to i }
        //构造二维数组用来存放action和goto
        this.actionTable = (0 until stateCount).map { i ->
            terminals.map { (terminal, _) ->
                action[i]!![terminal]
            }
        }
        this.gotoTable = (0 until stateCount).map { i ->
            nonTerminals.map { (nonTerminal, _) ->
                goto[i]?.get(nonTerminal)
            }
        }
        this.terminals = terminals.toMap()
        this.nonTerminals = nonTerminals.toMap()
    }

    override fun toString(): String {
        return toString(terminals.keys.toList(), nonTerminals.keys.toList())
    }

    fun toString(actionList: List<TerminalItem<T, *>>, gotoList: List<T>): String {
        val headAction = actionList.map {
            when(it) {
                is SymbolItem -> it.symbol
                is EOFItem -> "$"
                is SequenceItem -> "s"
                else -> it.toString()
            }
        }.joinToString(" ") { String.format("%-3s", it) }
        val headGoto = gotoList.map { it.name }.joinToString(" ") { String.format("%-2s", it ) }
        val head = "st | $headAction | $headGoto"
        val body = actionTable.zip(gotoTable).mapIndexed { i, (action, goto) ->
            val actionString = actionList.map { terminals[it]!! }.map { action[it] }.joinToString(" ") { it?.toString() ?: "   " }
            val gotoString = gotoList.map { nonTerminals[it]!! }.map { goto[it] }.joinToString(" ") { it?.let { String.format("%-2d", it) } ?: "  " }
            String.format("%-2d | %s | %s", i, actionString, gotoString)
        }.joinToString("\n")

        return "$head\n$body"
    }
}