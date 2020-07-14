import CashflowManager from './CashflowManager'

const csm = new CashflowManager({
  periods: 12,
  startDate: '1-Jan-2020',
  dateIncrement: 'months',
  dateLocale: 'es',
  dateFormat: 'MMMM YYYY'
})
const loanAmount = 10000
let currentLoanAmount = loanAmount
csm.addCashflowVariable({
  name: 'capital',
  calcVariables: [
    {
      name: 'totalPeriods',
      lookBehind: 0,
      type: 'current'
    }
  ],
  calc: totalPeriods => {
    const capital = loanAmount / totalPeriods
    currentLoanAmount -= capital
    return capital
  }
})
csm.addCashflowVariable({
  name: 'interest',
  calcVariables: [
    {
      name: 'capital',
      lookBehind: 1,
      type: 'current'
    }
  ],
  calc: (capital: number) => capital * 0.0087
})
console.log('Result', csm.calc())
