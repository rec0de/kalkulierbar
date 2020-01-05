package kalkulierbar

import kalkulierbar.clause.Atom
import kalkulierbar.clause.Clause
import kalkulierbar.clause.ClauseSet
import kalkulierbar.logic.And
import kalkulierbar.logic.Equiv
import kalkulierbar.logic.Impl
import kalkulierbar.logic.Not
import kalkulierbar.logic.Or
import kalkulierbar.logic.Var
import kotlin.test.BeforeTest
import kotlin.test.assertEquals
import org.junit.jupiter.api.Test

class TestPropositionalLogic {

    private lateinit var v1: Var
    private lateinit var v2: Var
    private lateinit var v3: Var

    private lateinit var n1: Not
    private lateinit var n2: Not
    private lateinit var n3: Not

    private lateinit var a1: And
    private lateinit var a2: And
    private lateinit var a3: And

    private lateinit var o1: Or
    private lateinit var o2: Or
    private lateinit var o3: Or

    @BeforeTest
    fun before() {
        v1 = Var("a")
        v2 = Var("MyTestVar")
        v3 = Var("MyT35tV4r")

        n1 = Not(Var("a"))
        n2 = Not(Equiv(Not(Not(Var("b"))), Var("a")))
        n3 = Not(And(Or(Var("a"), Not(Var("a"))), Not(Var("c"))))

        a1 = And(Not(Var("a")), And(Var("b"), Impl(Var("b"), Var("a"))))
        a2 = And(Var("a"), Not(Var("a")))
        a3 = And(Or(Var("a"), Not(Var("a"))), Var("b"))

        o1 = Or(Var("a"), Var("!a"))
        o2 = Or(Or(Var("a"), Not(Var("b"))), Equiv(Var("a"), Var("b")))
        o3 = Or(Not(And(Var("a"), Var("b"))), Not(Impl(Var("b"), Not(Var("b")))))
    }

    @Test
    fun testVarToBasicOps() {
        assertEquals("a", v1.toBasicOps().toString())
        assertEquals("MyTestVar", v2.toBasicOps().toString())
        assertEquals("MyT35tV4r", v3.toBasicOps().toString())
    }

    @Test
    fun testVarGetTseytinName() {
        assertEquals("vara", v1.getTseytinName(0))
        assertEquals("varMyTestVar", v2.getTseytinName(69))
        assertEquals("varMyT35tV4r", v3.getTseytinName(1337))
    }

    @Test
    fun testVarNaiveCNF() {
        val expected1 = ClauseSet(mutableListOf(Clause(mutableListOf(Atom("a"))))).toString()
        val expected2 = ClauseSet(mutableListOf(Clause(mutableListOf(Atom("MyTestVar"))))).toString()
        val expected3 = ClauseSet(mutableListOf(Clause(mutableListOf(Atom("MyT35tV4r"))))).toString()

        assertEquals(false, expected1 == expected2)
        assertEquals(expected1, v1.naiveCNF().toString())
        assertEquals(expected2, v2.naiveCNF().toString())
        assertEquals(expected3, v3.naiveCNF().toString())
    }

    @Test
    fun testVarTseytin() {
        assertEquals("{vara}", v1.tseytinCNF().toString())
        assertEquals("{varMyTestVar}", v2.tseytinCNF().toString())
        assertEquals("{varMyT35tV4r}", v3.tseytinCNF().toString())
    }

    @Test
    fun testNotToBasicOps() {
        assertEquals("!a", n1.toBasicOps().toString())
        assertEquals("!((!!b ∧ a) ∨ (!!!b ∧ !a))", n2.toBasicOps().toString())
        assertEquals("!((a ∨ !a) ∧ !c)", n3.toBasicOps().toString())
    }

    @Test
    fun testNotGetTseytinName() {
        assertEquals("not1", n1.getTseytinName(1))
        assertEquals("not345", n2.getTseytinName(345))
    }

    @Test
    fun testNotNaiveCNF() {
        val expected1 = ClauseSet(mutableListOf(Clause(mutableListOf(Atom("a", true)))))
        assertEquals(expected1.toString(), n1.naiveCNF().toString())

        val expected2 = "{b, a}, {b, !b}, {!a, a}, {!a, !b}"
        assertEquals(expected2.toString(), n2.naiveCNF().toString())

        val expected3 = ClauseSet(mutableListOf(Clause(mutableListOf(Atom("a", true), Atom("c"))),
                Clause(mutableListOf(Atom("a"), Atom("c")))))
        assertEquals(expected3.toString(), n3.naiveCNF().toString())
    }

    @Test
    fun testNotTseytin() {
        assertEquals("{not0}, {!vara, !not0}, {vara, not0}", n1.tseytinCNF().toString())
        assertEquals(
                "{not0}, {!varb, !not3}, {varb, not3}, {!not3, !not2}, {not3, not2}, {not2, !vara, !equiv1}, {!not2, vara, !equiv1}, {!not2, !vara, equiv1}, {not2, vara, equiv1}, {!equiv1, !not0}, {equiv1, not0}",
                n2.tseytinCNF().toString())
        assertEquals(
                "{not0}, {!vara, !not4}, {vara, not4}, {!vara, or2}, {!not4, or2}, {vara, not4, !or2}, {!varc, !not6}, {varc, not6}, {or2, !and1}, {not6, !and1}, {!or2, !not6, and1}, {!and1, !not0}, {and1, not0}",
                n3.tseytinCNF().toString())
    }

    @Test
    fun testAndToBasicOps() {
        assertEquals("(!a ∧ (b ∧ (!b ∨ a)))", a1.toBasicOps().toString())
        assertEquals("(a ∧ !a)", a2.toBasicOps().toString())
        assertEquals("((a ∨ !a) ∧ b)", a3.toBasicOps().toString())
    }

    @Test
    fun testAndGetGetTseytinName() {
        assertEquals("and5", a1.getTseytinName(5))
    }

    @Test
    fun testAndNaiveCNF() {
        assertEquals("{!a}, {b}, {!b, a}", a1.naiveCNF().toString())
        assertEquals("{a}, {!a}", a2.naiveCNF().toString())
        assertEquals("{a, !a}, {b}", a3.naiveCNF().toString())
    }

    @Test
    fun testAndTseytin() {
        assertEquals(
                "{and0}, {!vara, !not1}, {vara, not1}, {varb, impl5}, {!vara, impl5}, {!varb, vara, !impl5}, {varb, !and3}, {impl5, !and3}, {!varb, !impl5, and3}, {not1, !and0}, {and3, !and0}, {!not1, !and3, and0}",
                a1.tseytinCNF().toString())
        assertEquals(
                "{and0}, {!vara, !not2}, {vara, not2}, {vara, !and0}, {not2, !and0}, {!vara, !not2, and0}",
                a2.tseytinCNF().toString())
        assertEquals(
                "{and0}, {!vara, !not3}, {vara, not3}, {!vara, or1}, {!not3, or1}, {vara, not3, !or1}, {or1, !and0}, {varb, !and0}, {!or1, !varb, and0}",
                a3.tseytinCNF().toString())
    }

    @Test
    fun testOrToBasicOps() {
        assertEquals("(a ∨ !a)", o1.toBasicOps().toString())
        assertEquals("((a ∨ !b) ∨ ((a ∧ b) ∨ (!a ∧ !b)))", o2.toBasicOps().toString())
        assertEquals("(!(a ∧ b) ∨ !(!b ∨ !b))", o3.toBasicOps().toString())
    }

    @Test
    fun testOrGetGetTseytinName() {
        assertEquals("or5", o1.getTseytinName(5))
    }

    @Test
    fun testOrNaiveCNF() {
        assertEquals("{a, !a}", o1.naiveCNF().toString())
        assertEquals("{a, !b, a, !a}, {a, !b, a, !b}, {a, !b, b, !a}, {a, !b, b, !b}", o2.naiveCNF().toString())
        assertEquals("{!a, !b, b}, {!a, !b, b}", o3.naiveCNF().toString())
    }

    @Test
    fun testOrTseytin() {
        assertEquals(
                "{or0}, {!vara, or0}, {!var!a, or0}, {vara, var!a, !or0}",
                o1.tseytinCNF().toString())
        assertEquals(
                "{or0}, {!vara, or0}, {!var!a, or0}, {vara, var!a, !or0}",
                o1.tseytinCNF().toString())
        assertEquals(
                "{or0}, {!vara, or0}, {!var!a, or0}, {vara, var!a, !or0}",
                o1.tseytinCNF().toString())
    }
}