interface ExternalVariable {
	name: string;
	value: number | string;
}

interface CashflowVariable {
	name: string;
	conditionVariables?: string[];
	condition?: (...conditionVariables: any) => boolean;
	calcVariables?: string[];
	calc: (...calcVariables: any[]) => number;
}

class CashflowManager {
	periods: number;
	externalVariables: ExternalVariable[];
	cashflowVariables: CashflowVariable[];

	constructor(periods: number) {
		this.periods = periods;
		this.externalVariables = [];
		this.cashflowVariables = [];
	}

	addExternalVariable(variable: ExternalVariable) {
		this.externalVariables.push(variable);
	}

	addCashflowVariable(variable: CashflowVariable) {
		this.cashflowVariables.push(variable);
	}

	calc() {
		const cashflowVariableResults: { [name: string]: number[] } = {};
    this.cashflowVariables.forEach((cashFlowVariable) => (cashflowVariableResults[cashFlowVariable.name] = []));
    for (let period = 0; period < this.periods; period++) {
      // Calculate all cashflow variables
      this.cashflowVariables.forEach(csVariable => {
        const { conditionVariables, condition, calcVariables, calc } = csVariable;
        // Check for condition
      })
    }
	}
}

export default CashflowManager;
