interface Variable {
  name: string
  calc: () => number | string
}

interface ExternalVariable extends Variable {}

interface InternalVariable extends Variable {}

interface CashflowVariable extends Variable {
  conditionVariables?: string[]
  condition?: (...conditionVariables: any) => boolean
  calcVariables?: string[]
  calc: (...calcVariables: any[]) => number
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
    const cashflowVariableResults: { [name: string]: number[] } = {}

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
          calcVariables.forEach(calcVariableName => {
            if (internalVariableResults[calcVariableName]) {
              // Found in internal variables
              const variableResults = internalVariableResults[calcVariableName]
              if (typeof variableResults[period] !== 'undefined') {
                // Add current Value
                calcVariableResults.push(variableResults[period])
                return
              }
              if (typeof variableResults[period - 1] !== 'undefined') {
                // Add previous Value
                calcVariableResults.push(variableResults[period - 1])
              }
              return
            }

            if (externalVariableResults[calcVariableName]) {
              // Found in external variables
              const variableResults = externalVariableResults[calcVariableName]
              if (typeof variableResults[period] !== 'undefined') {
                // Add current Value
                calcVariableResults.push(variableResults[period])
                return
              }
              if (typeof variableResults[period - 1] !== 'undefined') {
                // Add previous Value
                calcVariableResults.push(variableResults[period - 1])
              }
              return
            }

            if (cashflowVariableResults[calcVariableName]) {
              // Found in cashflow variables
              const variableResults = cashflowVariableResults[calcVariableName]
              if (typeof variableResults[period] !== 'undefined') {
                // Add current Value
                calcVariableResults.push(variableResults[period])
                return
              }
              if (typeof variableResults[period - 1] !== 'undefined') {
                // Add previous Value
                calcVariableResults.push(variableResults[period - 1])
              }
              return
            }

            throw new Error(`calcVariable '${calcVariableName}' not found`)
          })

        // Calculate
        cashflowVariableResults[csVariable.name].push(csVariable.calc(...calcVariableResults))
        periodTotal +=
          cashflowVariableResults[csVariable.name][
            cashflowVariableResults[csVariable.name].length - 1
          ]
      })

      // Add period total
      cashflowVariableResults.total.push(periodTotal)
    }
    return cashflowVariableResults
  }
}

export default CashflowManager
