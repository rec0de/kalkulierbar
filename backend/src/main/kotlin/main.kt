package main.kotlin

import io.javalin.Javalin
import kalkulierbar.*

// List of all active calculi (calculuus?)
val endpoints: Set<Calculus> = setOf<Calculus>(ClauseAcceptor())

/**
 * Starts a Javalin Server and creates API methods for active calculus objects
 */
fun main(args: Array<String>) {

	val port = 7000
    val app = Javalin.create().start(port)
	
	// Catch explicitly thrown exceptions
	app.exception(KalkulierbarException::class.java) { e, ctx ->
    	ctx.result(e.message ?: "Unknown exception")
	}

	// Serve a small overview at the root endpoint listing all active calculus identifiers
    app.get("/") { ctx -> ctx.result("KalkulierbaR API Server\n\nAvailable calculus endpoints:\n${endpoints.map{it.identifier}.joinToString("\n")}") }
	
	// Create API methods for each calculus
	for(endpoint in endpoints) {
		val name = endpoint.identifier
		
		// Small documentation at the main calculus endpoint
		app.get("/$name") {
			ctx -> ctx.result("Calculus \"$name\" loaded.\nInteract via the /parse /move and /close endpoints\n\nCalculus Documentation:\n\n${endpoint.getDocumentation()}")
		}

		// Parse endpoint takes formula parameter and passes it to calculus implementation
		app.post("/$name/parse") { ctx ->
			val formula = ctx.formParam("formula")
			if(formula == null)
				throw ApiMisuseException("POST parameter 'formula' needs to be present")
			ctx.result(endpoint.parseFormula(formula))
		}
		
		// Move endpoint takes state and move parameter values and passes them to calculus implementation
		app.post("/$name/move") { ctx ->
			val state = ctx.formParam("state")
			val move = ctx.formParam("move")
			if(state == null)
				throw ApiMisuseException("POST parameter 'state' with state representation needs to be present")
			if(move == null)
				throw ApiMisuseException("POST parameter 'move' with move representation needs to be present")
			ctx.result(endpoint.applyMove(state, move))
		}
		
		// Close endpoint takes state parameter value and passes it to calculus implementation
		app.post("/$name/close") { ctx ->
			val state = ctx.formParam("state")
			if(state == null)
				throw ApiMisuseException("POST parameter 'state' with state representation must be present")
			ctx.result(if(endpoint.checkClose(state)) "Proof closed" else "Incomplete Proof")
		}
	}
}

class ApiMisuseException(msg: String): Exception(msg)