export interface StatutoryRates {
  napsa_employee: number;
  napsa_employer: number;
  nhima_employee: number;
  nhima_employer: number;
}

export interface PayeBracket {
  min_amount: number;
  max_amount: number | null;
  rate: number;
  fixed_amount: number;
}

export interface PayrollInput {
  baseSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  lunchAllowance: number;
  otherAllowances: number;
  bonuses: number;
  otherDeductions: number;
}

export interface PayrollCalculation {
  baseSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  lunchAllowance: number;
  otherAllowances: number;
  totalAllowances: number;
  bonuses: number;
  grossPay: number;
  napsaEmployee: number;
  napsaEmployer: number;
  nhimaEmployee: number;
  nhimaEmployer: number;
  paye: number;
  totalDeductions: number;
  otherDeductions: number;
  netPay: number;
}

export function calculatePAYE(taxableIncome: number, brackets: PayeBracket[]): number {
  // Sort brackets by min_amount
  const sortedBrackets = [...brackets].sort((a, b) => a.min_amount - b.min_amount);
  
  for (const bracket of sortedBrackets) {
    const maxAmount = bracket.max_amount ?? Infinity;
    if (taxableIncome > bracket.min_amount && taxableIncome <= maxAmount) {
      const taxableAboveMin = taxableIncome - bracket.min_amount;
      return bracket.fixed_amount + (taxableAboveMin * (bracket.rate / 100));
    }
  }
  
  // If income is in the highest bracket (no max)
  const highestBracket = sortedBrackets[sortedBrackets.length - 1];
  if (taxableIncome > highestBracket.min_amount) {
    const taxableAboveMin = taxableIncome - highestBracket.min_amount;
    return highestBracket.fixed_amount + (taxableAboveMin * (highestBracket.rate / 100));
  }
  
  return 0;
}

export function calculatePayroll(
  input: PayrollInput,
  statutoryRates: StatutoryRates,
  payeBrackets: PayeBracket[]
): PayrollCalculation {
  const totalAllowances = 
    input.housingAllowance + 
    input.transportAllowance + 
    input.lunchAllowance + 
    input.otherAllowances;
  
  const grossPay = input.baseSalary + totalAllowances + input.bonuses;
  
  // Calculate statutory deductions based on gross pay
  const napsaEmployee = grossPay * (statutoryRates.napsa_employee / 100);
  const napsaEmployer = grossPay * (statutoryRates.napsa_employer / 100);
  const nhimaEmployee = grossPay * (statutoryRates.nhima_employee / 100);
  const nhimaEmployer = grossPay * (statutoryRates.nhima_employer / 100);
  
  // Taxable income for PAYE (gross minus NAPSA employee contribution)
  const taxableIncome = grossPay - napsaEmployee;
  const paye = calculatePAYE(taxableIncome, payeBrackets);
  
  const totalDeductions = napsaEmployee + nhimaEmployee + paye + input.otherDeductions;
  const netPay = grossPay - totalDeductions;
  
  return {
    baseSalary: input.baseSalary,
    housingAllowance: input.housingAllowance,
    transportAllowance: input.transportAllowance,
    lunchAllowance: input.lunchAllowance,
    otherAllowances: input.otherAllowances,
    totalAllowances,
    bonuses: input.bonuses,
    grossPay,
    napsaEmployee,
    napsaEmployer,
    nhimaEmployee,
    nhimaEmployer,
    paye,
    totalDeductions,
    otherDeductions: input.otherDeductions,
    netPay,
  };
}

export function formatZMW(amount: number): string {
  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency: "ZMW",
  }).format(amount);
}
