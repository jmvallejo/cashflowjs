import CashflowManager from './CashflowManager'

const csm = new CashflowManager(12)
const loanAmount = 10000
let currentLoanAmount = loanAmount
csm.addCashflowVariable({
  name: 'interest',
  calc: () => currentLoanAmount * 0.0087
})
csm.addCashflowVariable({
  name: 'capital',
  calcVariables: [ 'totalPeriods' ],
  calc: totalPeriods => {
    const capital = loanAmount / totalPeriods
    currentLoanAmount -= capital
    return capital
  }
})
console.log('Result', csm.calc())
