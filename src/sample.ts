import CashflowManager from './CashflowManager'

const csm = new CashflowManager({
  periods: 18,
  startDate: '1-Mar-2018',
  dateIncrement: 'months',
  dateLocale: 'es',
  dateFormat: 'MMMM YYYY'
})

csm.addExternalVariable({
  name: 'squareMeterValue',
  calc: () => 1600000
})
csm.addExternalVariable({
  name: 'totalMeters',
  calc: () => 6000
})
csm.addExternalVariable({
  name: 'monthlyIndex',
  calc: () => 0.005
})
csm.addCashflowVariable({
  name: 'monthlyMeters',
  calcVariables: [
    {
      name: 'totalMeters',
      lookBehind: 0,
      type: 'current'
    },
    {
      name: 'totalPeriods',
      lookBehind: 0,
      type: 'current'
    }
  ],
  calc: (totalMeters, totalPeriods) => totalMeters / totalPeriods,
  skipTotal: true
})
csm.addCashflowVariable({
  name: 'monthlyMeterCost',
  calcVariables: [
    {
      name: 'monthlyMeters',
      lookBehind: 0,
      type: 'current'
    },
    {
      name: 'squareMeterValue',
      lookBehind: 0,
      type: 'current'
    }
  ],
  calc: (monthlyMeters, squareMeterValue) => monthlyMeters * squareMeterValue,
  hidden: true
})
csm.addCashflowVariable({
  name: 'monthlyMeterIndexedCost',
  calcVariables: [
    {
      name: 'monthlyMeterCost',
      lookBehind: 0,
      type: 'current'
    },
    {
      name: 'monthlyIndex',
      lookBehind: 0,
      type: 'current'
    },
    {
      name: 'periodNumber',
      lookBehind: 0,
      type: 'current'
    }
  ],
  calc: (monthlyMeterCost, monthlyIndex, period) => monthlyMeterCost + (monthlyMeterCost * period * monthlyIndex)
})

try {
  console.log('Result', csm.calc())
} catch (err) {
  console.error(err && err.message)
}
