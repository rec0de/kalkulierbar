package kalkulierbar

open class KalkulierbarException(msg: String): Exception(msg)

class InvalidFormulaFormat(msg: String): KalkulierbarException(msg)