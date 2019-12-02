package kalkulierbar

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class TestPropositionalTableaux {

    val instance = PropositionalTableaux()

    val invalidString1 = "a,b;c,!d;e,&;g,h,i,!j"
    val invalidString2 = "richtig; oder,!falsch"
    val invalidString3 = "mal,am,Ende "

    val validString1 = "!a,b;c,!d;e,f,g,!h;i,j,!k,l,!m;n;o;p"
    val validString2 = "hey,was,!geht;bin,!ich,richtig"
    val validString3 = "!ja;vi;!ell;ei;!ch;t"

    val emptyString = ""

    val edgeCase1 = "ein,!im;Wo!rt"
    val edgeCase2 = "kein,valName,!"
    val edgeCase3 = "doppelter;Semikolon;;hello"

    /*
        Test parseFormulaToState
    */

    @Test
    fun testParseInvalidStrings() {
        assertFailsWith<InvalidFormulaFormat> {
            instance.parseFormulaToState(invalidString1)
        }
        assertFailsWith<InvalidFormulaFormat> {
            instance.parseFormulaToState(invalidString2)
        }
        assertFailsWith<InvalidFormulaFormat> {
            instance.parseFormulaToState(invalidString3)
        }
    }

    @Test
    fun testParseValidString() {
        val state1 = instance.parseFormulaToState(validString1)
        val state2 = instance.parseFormulaToState(validString2)
        val state3 = instance.parseFormulaToState(validString3)

        val root1 = state1.nodes[0]
        val root2 = state2.nodes[0]
        val root3 = state3.nodes[0]

        assertEquals(state1.nodes.size, 1)
        assertEquals(root1.parent, 0)
        assertEquals(root1.spelling, "true")
        assertEquals(root1.negated, false)

        assertEquals(state2.nodes.size, 1)
        assertEquals(root2.parent, 0)
        assertEquals(root2.spelling, "true")
        assertEquals(root2.negated, false)

        assertEquals(state3.nodes.size, 1)
        assertEquals(root3.parent, 0)
        assertEquals(root3.spelling, "true")
        assertEquals(root3.negated, false)
    }

    @Test
    fun testParseEdgeCases() {
        assertFailsWith<InvalidFormulaFormat> {
            instance.parseFormulaToState(emptyString)
        }
        assertFailsWith<InvalidFormulaFormat> {
            instance.parseFormulaToState(edgeCase1)
        }
        assertFailsWith<InvalidFormulaFormat> {
            instance.parseFormulaToState(edgeCase2)
        }
        assertFailsWith<InvalidFormulaFormat> {
            instance.parseFormulaToState(edgeCase3)
        }
    }

    /*
        Test applyMoveOnState
    */

    @Test
    @kotlinx.serialization.UnstableDefault
    fun testUnknownMove() {
        var state = instance.parseFormulaToState("a,b,c;d")
        val hash = state.getHash()

        assertFailsWith<IllegalMove> {
            instance.applyMoveOnState(state, "{\"type\":\"d\", \"id1\": 1, \"id2\": 0}")
        }

        assertEquals(hash, state.getHash()) // Verify that state has not been modified
    }

    @Test
    @kotlinx.serialization.UnstableDefault
    fun testApplyMoveNullValues() {
        var state = instance.parseFormulaToState("a,b;c")

        val hash = state.getHash()

        assertFailsWith<JsonParseException> {
            instance.applyMoveOnState(state, "{\"type\":\"e\", \"id1\": null, \"id2\": 2}")
        }

        assertFailsWith<JsonParseException> {
            instance.applyMoveOnState(state, "{\"type\":null, \"id1\": 0, \"id2\": -3}")
        }

        assertFailsWith<JsonParseException> {
            instance.applyMoveOnState(state, "{\"type\":null, \"id1\": 0, \"id2\": null}")
        }

        assertEquals(hash, state.getHash()) // Verify that state has not been modified
    }

    @Test
    @kotlinx.serialization.UnstableDefault
    fun testExpandValidA() {
        var state = instance.parseFormulaToState("a,b,c;d")

        state = instance.applyMoveOnState(state, "{\"type\":\"e\", \"id1\": 0, \"id2\": 0}")

        assertEquals(4, state.nodes.size)
        assertEquals(3, state.nodes.get(0).children.size)
        assertEquals("tableauxstate|{a, b, c}, {d}|[true;p;0;-;i;o;(1,2,3)|a;p;0;-;l;o;()|b;p;0;-;l;o;()|c;p;0;-;l;o;()]", state.getHash())
    }

    @Test
    @kotlinx.serialization.UnstableDefault
    fun testExpandValidB() {
        var state = instance.parseFormulaToState("a,b,c;d")

        state = instance.applyMoveOnState(state, "{\"type\":\"e\", \"id1\": 0, \"id2\": 1}")

        assertEquals(2, state.nodes.size)
        assertEquals(1, state.nodes.get(0).children.size)
        assertEquals("tableauxstate|{a, b, c}, {d}|[true;p;0;-;i;o;(1)|d;p;0;-;l;o;()]", state.getHash())
    }

    @Test
    @kotlinx.serialization.UnstableDefault
    fun testExpandValidC() {
        var state = instance.parseFormulaToState("a,b,c;d")

        state = instance.applyMoveOnState(state, "{\"type\":\"e\", \"id1\": 0, \"id2\": 0}")
        state = instance.applyMoveOnState(state, "{\"type\":\"e\", \"id1\": 3, \"id2\": 1}")

        assertEquals(5, state.nodes.size)
        assertEquals(3, state.nodes.get(0).children.size)
        assertEquals(1, state.nodes.get(3).children.size)
        assertEquals("tableauxstate|{a, b, c}, {d}|[true;p;0;-;i;o;(1,2,3)|a;p;0;-;l;o;()|b;p;0;-;l;o;()|c;p;0;-;i;o;(4)|d;p;3;-;l;o;()]", state.getHash())
    }

    @Test
    @kotlinx.serialization.UnstableDefault
    fun testExpandLeafIndexOOB() {
        var state = instance.parseFormulaToState("a,b;c")

        val hash = state.getHash()

        assertFailsWith<IllegalMove> {
            instance.applyMoveOnState(state, "{\"type\":\"e\", \"id1\": 1, \"id2\": 0}")
        }

        assertFailsWith<IllegalMove> {
            instance.applyMoveOnState(state, "{\"type\":\"e\", \"id1\": -15, \"id2\": 0}")
        }

        assertEquals(hash, state.getHash()) // Verify that state has not been modified
    }

    @Test
    @kotlinx.serialization.UnstableDefault
    fun testExpandClauseIndexOOB() {
        var state = instance.parseFormulaToState("a,b;c")

        val hash = state.getHash()

        assertFailsWith<IllegalMove> {
            instance.applyMoveOnState(state, "{\"type\":\"e\", \"id1\": 0, \"id2\": 2}")
        }

        assertFailsWith<IllegalMove> {
            instance.applyMoveOnState(state, "{\"type\":\"e\", \"id1\": 0, \"id2\": -3}")
        }

        assertEquals(hash, state.getHash()) // Verify that state has not been modified
    }

    @Test
    @kotlinx.serialization.UnstableDefault
    fun testExpandOnNonLeaf() {
        var state = instance.parseFormulaToState("a,b;c")

        state = instance.applyMoveOnState(state, "{\"type\":\"e\", \"id1\": 0, \"id2\": 1}")
        state = instance.applyMoveOnState(state, "{\"type\":\"e\", \"id1\": 1, \"id2\": 1}")

        val hash = state.getHash()

        assertFailsWith<IllegalMove> {
            instance.applyMoveOnState(state, "{\"type\":\"e\", \"id1\": 0, \"id2\": 0}")
        }

        assertFailsWith<IllegalMove> {
            instance.applyMoveOnState(state, "{\"type\":\"e\", \"id1\": 1, \"id2\": 0}")
        }

        assertEquals(hash, state.getHash()) // Verify that state has not been modified
    }

    @Test
    @kotlinx.serialization.UnstableDefault
    fun testExpandClosedLeaf() {
        var state = instance.parseFormulaToState("a;!a")

        state = instance.applyMoveOnState(state, "{\"type\":\"e\", \"id1\": 0, \"id2\": 0}")
        state = instance.applyMoveOnState(state, "{\"type\":\"e\", \"id1\": 1, \"id2\": 1}")

        val leaf = state.nodes.get(2)
        leaf.isClosed = true
        leaf.closeRef = 1

        assertFailsWith<IllegalMove> {
            instance.applyMoveOnState(state, "{\"type\":\"e\", \"id1\": 2, \"id2\": 0}")
        }
    }

    // ApplyCose state creation helper function
    private fun createArtificialExpandState(nodes: List<TableauxNode>, state: TableauxState): TableauxState {
        state.nodes.addAll(nodes)

        for (i in nodes.indices) {
            val parentThisNode = nodes[i].parent
            state.nodes[parentThisNode].children.add(i + 1)
        }
        return state
    }

    @Test
    @kotlinx.serialization.UnstableDefault
    fun testApplyCloseValidA() {
        var state = instance.parseFormulaToState("a,b;!b")

        val nodes = listOf(
                TableauxNode(0, "a", false),
                TableauxNode(0, "b", false),
                TableauxNode(2, "b", true)
        )
        state = createArtificialExpandState(nodes, state)
        state = instance.applyMoveOnState(state, "{\"type\":\"c\", \"id1\": 3, \"id2\": 2}")

        assertEquals(true, state.nodes[3].isClosed)
        assertEquals(2, state.nodes[3].closeRef)
        assertEquals("tableauxstate|{a, b}, {!b}|[true;p;0;-;i;o;(1,2)|a;p;0;-;l;o;()|b;p;0;-;i;o;(3)|b;n;2;2;l;c;()]", state.getHash())
    }

    @Test
    @kotlinx.serialization.UnstableDefault
    fun testApplyCloseValidB() {
        var state = instance.parseFormulaToState("a,b,c;!a;!b;!c")

        val nodes = listOf(
                TableauxNode(0, "b", true),
                TableauxNode(1, "a", false),
                TableauxNode(1, "b", false),
                TableauxNode(1, "c", false)
        )
        state = createArtificialExpandState(nodes, state)
        state = instance.applyMoveOnState(state, "{\"type\":\"c\", \"id1\": 3, \"id2\": 1}")

        assertEquals(true, state.nodes[3].isClosed)

        assertEquals(false, state.nodes[2].isClosed)
        assertEquals(false, state.nodes[4].isClosed)

        assertEquals(1, state.nodes[3].closeRef)
        assertEquals("tableauxstate|{a, b, c}, {!a}, {!b}, {!c}|[true;p;0;-;i;o;(1)|b;n;0;-;i;o;(2,3,4)|a;p;1;-;l;o;()|b;p;1;1;l;c;()|c;p;1;-;l;o;()]", state.getHash())
    }

    @Test
    @kotlinx.serialization.UnstableDefault
    fun testApplyCloseValidC() {
        var state = instance.parseFormulaToState("a,b,c;!a;!b;!c")

        val nodes = listOf(
                TableauxNode(0, "a", false),
                TableauxNode(0, "b", false),
                TableauxNode(0, "c", false),
                TableauxNode(1, "a", true),
                TableauxNode(2, "b", true)
        )
        state = createArtificialExpandState(nodes, state)

        state = instance.applyMoveOnState(state, "{\"type\":\"c\", \"id1\": 4, \"id2\": 1}")
        state = instance.applyMoveOnState(state, "{\"type\":\"c\", \"id1\": 5, \"id2\": 2}")

        assertEquals(true, state.nodes[4].isClosed)
        assertEquals(true, state.nodes[5].isClosed)

        assertEquals(false, state.nodes[3].isClosed)

        assertEquals(1, state.nodes[4].closeRef)
        assertEquals(2, state.nodes[5].closeRef)
        assertEquals("tableauxstate|{a, b, c}, {!a}, {!b}, {!c}|[true;p;0;-;i;o;(1,2,3)|a;p;0;-;i;o;(4)|b;p;0;-;i;o;(5)|c;p;0;-;l;o;()|a;n;1;1;l;c;()|b;n;2;2;l;c;()]", state.getHash())
    }

    @Test
    @kotlinx.serialization.UnstableDefault
    fun testCloseLeafIndexOOB() {
        var state = instance.parseFormulaToState("a,b;c")

        val nodes = listOf(
                TableauxNode(0, "a", false),
                TableauxNode(0, "b", false),
                TableauxNode(1, "a", false),
                TableauxNode(1, "b", false)
        )
        state = createArtificialExpandState(nodes, state)

        val hash = state.getHash()

        assertFailsWith<IllegalMove> {
            instance.applyMoveOnState(state, "{\"type\":\"c\", \"id1\": 42, \"id2\": 1}")
        }

        assertFailsWith<IllegalMove> {
            instance.applyMoveOnState(state, "{\"type\":\"c\", \"id1\": -15, \"id2\": 1}")
        }

        assertEquals(hash, state.getHash()) // Verify that state has not been modified
    }

    @Test
    @kotlinx.serialization.UnstableDefault
    fun testCloseIndexOOB() {
        var state = instance.parseFormulaToState("a,b;c")

        val nodes = listOf(
                TableauxNode(0, "a", false),
                TableauxNode(0, "b", false),
                TableauxNode(1, "a", false),
                TableauxNode(1, "b", false)
        )
        state = createArtificialExpandState(nodes, state)

        val hash = state.getHash()

        assertFailsWith<IllegalMove> {
            instance.applyMoveOnState(state, "{\"type\":\"c\", \"id1\": 3, \"id2\": 403}")
        }

        assertFailsWith<IllegalMove> {
            instance.applyMoveOnState(state, "{\"type\":\"c\", \"id1\": 4, \"id2\": -3}")
        }

        assertEquals(hash, state.getHash()) // Verify that state has not been modified
    }

    @Test
    @kotlinx.serialization.UnstableDefault
    fun testCloseOnNonLeaf() {
        var state = instance.parseFormulaToState("a,b;c")

        val nodes = listOf(
                TableauxNode(0, "c", false),
                TableauxNode(1, "c", false)
        )
        state = createArtificialExpandState(nodes, state)

        val hash = state.getHash()

        assertFailsWith<IllegalMove> {
            instance.applyMoveOnState(state, "{\"type\":\"c\", \"id1\": 1, \"id2\": 2}")
        }

        assertFailsWith<IllegalMove> {
            instance.applyMoveOnState(state, "{\"type\":\"c\", \"id1\": 2, \"id2\": 1}")
        }

        assertEquals(hash, state.getHash()) // Verify that state has not been modified
    }

    @Test
    @kotlinx.serialization.UnstableDefault
    fun testCloseWithNonPath() {
        var state = instance.parseFormulaToState("a,b;!b")

        val nodes = listOf(
                TableauxNode(0, "a", false),
                TableauxNode(0, "b", false),
                TableauxNode(1, "a", false),
                TableauxNode(1, "b", false),
                TableauxNode(2, "b", true),
                TableauxNode(5, "a", false),
                TableauxNode(5, "b", false)
        )
        state = createArtificialExpandState(nodes, state)

        val hash = state.getHash()

        assertFailsWith<IllegalMove> {
            instance.applyMoveOnState(state, "{\"type\":\"c\", \"id1\": 4, \"id2\": 5}")
        }

        assertFailsWith<IllegalMove> {
            instance.applyMoveOnState(state, "{\"type\":\"c\", \"id1\": 5, \"id2\": 4}")
        }

        assertEquals(hash, state.getHash()) // Verify that state has not been modified
    }
}