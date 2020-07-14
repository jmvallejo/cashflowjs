import moment, { Moment } from 'moment'

interface Variable {
  name: string
  calc: () => number | string
}

interface ExternalVariable extends Variable {}

interface InternalVariable extends Variable {}

interface CalcVariableDescription {
  name: string
  lookBehind: number
  type: 'current' | 'sum' | 'avg'
}

interface CashflowVariable extends Variable {
  calcVariables?: CalcVariableDescription[]
  calc: (...calcVariables: any[]) => number
}

interface VariableResult {
  current: number
  sum: number
  avg: number
}

type DateIncrementUnits = 'days' | 'months' | 'years'

interface CashflowManagerOptions {
  periods: number
  startDate?: string
  dateIncrement?: DateIncrementUnits
  dateLocale?: string
  dateFormat?: string
}

class CashflowManager {
  periods: number
  startDate: Moment
  dateIncrementUnits: DateIncrementUnits
  dateFormat: string
  computedDates: string[]
  internalVariables: InternalVariable[]
  externalVariables: ExternalVariable[]
  cashflowVariables: CashflowVariable[]

  constructor (options: CashflowManagerOptions) {
    const {
      periods,
      startDate,
      dateIncrement,
      dateLocale,
      dateFormat
    } = options;
    dateLocale && moment.locale(dateLocale)
    this.periods = periods
    this.startDate = startDate ? moment(startDate) : moment()
    this.dateIncrementUnits = dateIncrement || 'months'
    this.dateFormat = dateFormat || 'LL'
    this.internalVariables = []
    this.externalVariables = []
    this.cashflowVariables = []
    this.computedDates = []

    this.addInternalVariables()
  }

  private addInternalVariables () {
    let currentPeriod = 0
    this.internalVariables.push({
      name: 'periodNumber',
      calc: () => ++currentPeriod
    })
    this.internalVariables.push({
      name: 'totalPeriods',
      calc: () => this.periods
    })
    let currentDate = this.startDate
    this.internalVariables.push({
      name: 'date',
      calc: () => {
        const dateInfo = currentPeriod === 1 ?
          currentDate.format(this.dateFormat) :
          currentDate.add(1, this.dateIncrementUnits).format(this.dateFormat)
        this.computedDates.push(dateInfo)
        return dateInfo
      }
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
    this.computedDates = []

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
        const { calcVariables, calc, name } = csVariable
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

            throw new Error(`calcVariable ${name} not found`)
          })

        // Calculate
        const current = calc(...calcVariableResults)
        const sum = cashflowVariableResults[name].reduce((accum, nextResult) => accum + nextResult.current, current)
        const avg = sum / (period + 1)
        cashflowVariableResults[name].push({
          current,
          sum,
          avg
        })
        periodTotal +=
          cashflowVariableResults[name][
            cashflowVariableResults[name].length - 1
          ].current
      })

      // Add period total
      const sum = cashflowVariableResults.total.reduce((accum, nextResult) => accum + nextResult.current, periodTotal)
      const avg = sum / (period + 1)
      cashflowVariableResults.total.push({
        current: periodTotal,
        sum,
        avg
      })
    }
    return {
      dates: this.computedDates,
      ...cashflowVariableResults
    }
  }
}

export default CashflowManager
