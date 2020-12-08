package com.heerkirov.hedge.server.utils

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class CompositionTest {
    open class Com(value: Int) : Composition<Com>(Com::class, value) {
        object A : Com(0b1)
        object B : Com(0b10)
        object C : Com(0b100)
        object D : Com(0b1000)
        object AB : Com(A.value or B.value)
        object CD : Com(C.value or D.value)
        object EMPTY : Com(0b0)
        companion object {
            val baseElements by lazy { listOf(A, B, C, D) }
            val exportedElements by lazy { listOf(AB, CD) }
            val empty = EMPTY
        }
    }

    @Test
    fun testToString() {
        assertEquals("A", Com.A.toString())
        assertEquals("B", Com.B.toString())
        assertEquals("C", Com.C.toString())
        assertEquals("D", Com.D.toString())
        assertEquals("AB", Com.AB.toString())
        assertEquals("CD", Com.CD.toString())
    }

    @Test
    fun testIsEmpty() {
        assertTrue { Com.EMPTY.isEmpty() }
        assertFalse { Com.A.isEmpty() }
        assertFalse { Com.AB.isEmpty() }
    }

    @Test
    fun testCalc() {
        assertEquals(Com.AB, Com.A + Com.B)
        assertEquals(Com.CD, Com.C + Com.D)
        assertEquals(Com.AB + Com.CD, Com.A + Com.B + Com.C + Com.D)
        assertTrue { Com.A in Com.AB }
        assertTrue { Com.B in Com.AB }
        assertFalse { Com.C in Com.AB }
        assertFalse { Com.AB in Com.CD }
        assertTrue { Com.EMPTY in Com.CD }
        assertTrue { (Com.A + Com.C) in (Com.AB + Com.CD) }
        assertTrue { Com.AB.any(Com.AB) }
        assertTrue { Com.AB.any(Com.A) }
        assertFalse { Com.AB.any(Com.CD) }
        assertTrue { (Com.AB + Com.C).any(Com.CD) }
        assertEquals(Com.AB + Com.CD, listOf(Com.A, Com.B, Com.C, Com.D).union())
        assertEquals(listOf(Com.A, Com.B, Com.C, Com.D), (Com.AB + Com.CD).toBaseElements())
        assertEquals(listOf(Com.AB, Com.C), listOf(Com.A, Com.B, Com.C).union().toExportedElements())
    }

    @Test
    fun testParse() {
        assertEquals(Com.A, compositionOf<Com>("A"))
        assertEquals(Com.AB, compositionOf<Com>("AB"))
    }
}