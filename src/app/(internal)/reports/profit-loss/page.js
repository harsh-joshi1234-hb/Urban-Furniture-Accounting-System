import { redirect } from 'next/navigation';

/** Alias matching the backend route name (/api/reports/profit-loss). */
export default function ProfitLossAlias() {
  redirect('/reports/profit-and-loss');
}
