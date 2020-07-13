interface Variable {
  name: string
  calc: () => number | string
}

interface ExternalVariable extends Variable {}

interface InternalVariable extends Variable {}

interface CalcVariableDescription {
  name: string
  lookBehind: number
  type: 'current' | 'sum'
}

interface CashflowVariable extends Variable {
  conditionVariables?: string[]
  condition?: (...conditionVariables: any) => boolean
  calcVariables?: CalcVariableDescription[]
  calc: (...calcVariables: any[]) => number
}

interface VariableResult {
  current: number
  sum: number
}

class CashflowManager {
  periods: number
  internalVariables: InternalVariable[]
  externalVariables: ExternalVariable[]
  cashflowVariables: CashflowVariable[]

  constructor (periods: number) {
    this.periods = periods
    this.internalVariables = []
    this.externalVariables = []
    this.cashflowVariables = []

    this.addInternalVariables()
  }

  private addInternalVariables () {
    let initialPeriod = 0
    this.internalVariables.push({
      name: 'periodNumber',
      calc: () => ++initialPeriod
    })
    this.internalVariables.push({
      name: 'totalPeriods',
      calc: () => this.periods
    })
  }

  get variables () {
    return [ ...this.internalVariables, ...this.externalVariables, ...this.cashflowVariables ]
  }

  addExternalVariable (variable: ExternalVariable) {
    this.externalVariables.push(variable)
  }

  addCashflowVariable (variable: CashflowVariable) {
    this.cashflowVariables.push(variable)
  }

  calc () {
    const internalVariableResults: { [name: string]: any[] } = {}
    const externalVariableResults: { [name: string]: any[] } = {}
    const cashflowVariableResults: { [name: string]: VariableResult[] } = {}

    this.internalVariables.forEach(
      internalVariable => (internalVariableResults[internalVariable.name] = [])
    )
    this.externalVariables.forEach(
      externalVariable => (externalVariableResults[externalVariable.name] = [])
    )
    this.cashflowVariables.forEach(
      cashFlowVariable => (cashflowVariableResults[cashFlowVariable.name] = [])
    )
    // Add cashflow total
    cashflowVariableResults.total = []

    // Calculate each period
    for (let period = 0; period < this.periods; period++) {
      // Calculate internal variables
      this.internalVariables.forEach(variable =>
        internalVariableResults[variable.name].push(variable.calc())
      )

      // Calculate external variables
      this.externalVariables.forEach(variable =>
        externalVariableResults[variable.name].push(variable.calc())
      )

      // Calculate all cashflow variables
      let periodTotal = 0
      this.cashflowVariables.forEach(csVariable => {
        const { conditionVariables, condition, calcVariables, calc } = csVariable
        // Check for condition
        if (condition) {
          // Check condition using condition variables
        }
        // Get calc variables if defined
        const calcVariableResults = []
        calcVariables &&
          calcVariables.forEach(calcVariable => {
            const { name, lookBehind, type } = calcVariable;
            // Calculate period index
            const periodIndex = period - lookBehind;
            if (periodIndex < 0) {
              calcVariableResults.push(0)
              return
            }

            if (internalVariableResults[name]) {
              // Found in internal variables
              const variableResults = internalVariableResults[name]
              if (typeof variableResults[periodIndex] !== 'undefined') {
                // Add current Value
                calcVariableResults.push(variableResults[periodIndex])
                return
              }
            }

            if (externalVariableResults[name]) {
              // Found in external variables
              const variableResults = externalVariableResults[name]
              if (typeof variableResults[periodIndex] !== 'undefined') {
                // Add current Value
                calcVariableResults.push(variableResults[periodIndex])
                return
              }
            }

            if (cashflowVariableResults[name]) {
              // Found in cashflow variables
              const variableResults = cashflowVariableResults[name]
              if (typeof variableResults[periodIndex] !== 'undefined') {
                // Add current Value
                calcVariableResults.push(variableResults[periodIndex][type])
                return
              }
            }

            throw new Error(`calcVariable '${name}' not found`)
          })

        // Calculate
        const current = csVariable.calc(...calcVariableResults)
        cashflowVariableResults[csVariable.name].push({
          current,
          sum: cashflowVariableResults[csVariable.name].reduce((accum, nextResult) => accum + nextResult.current, current)
        })
        periodTotal +=
          cashflowVariableResults[csVariable.name][
            cashflowVariableResults[csVariable.name].length - 1
          ].current
      })

      // Add period total
      cashflowVariableResults.total.push({
        current: periodTotal,
        sum: cashflowVariableResults.total.reduce((accum, nextResult) => accum + nextResult.current, periodTotal)
      })
    }
    return cashflowVariableResults
  }
}

export default CashflowManager
