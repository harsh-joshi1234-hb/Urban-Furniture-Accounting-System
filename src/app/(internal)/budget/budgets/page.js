import { redirect } from 'next/navigation';

/** Alias for the budget screen, which lives under the Account menu. */
export default function BudgetBudgetsAlias() {
  redirect('/account/budgets');
}
