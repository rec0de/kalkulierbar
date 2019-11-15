package main.kotlin.kalkulierbar.clause

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonConfiguration

val json = Json(JsonConfiguration.Stable)

@Serializable
class ClauseSet(private var clauses: MutableSet<Clause> = HashSet()) {
    fun add(c: Clause) {
        clauses.add(c)
    }

    fun addAll(c: Collection<Clause>) {
        c.forEach { add(it) }
    }

    override fun toString(): String {
        return clauses.joinToString(", ")
    }
}
