/**
 * Static product preview for the landing page.
 *
 * The figures here are illustrative sample data, not live numbers - the page is
 * public and has no session to read from. It is labelled as a preview so it can
 * never be mistaken for a real report.
 */
export default function DashboardPreview() {
  const bars = [40, 62, 48, 78, 96, 70];

  return (
    <div
      className="w-full overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_18px_50px_rgba(28,25,23,0.18)]"
      role="img"
      aria-label="Preview of the Urban Furniture dashboard with sample data"
    >
      <div className="flex">
        {/* mini sidebar */}
        <div className="hidden w-32 shrink-0 bg-[#1c1917] p-2.5 sm:block">
          <div className="mb-3 flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-brand-600 text-[7px] font-bold text-white">
              UF
            </span>
            <span className="text-[8px] font-semibold text-white">Urban Furniture</span>
          </div>
          {['Dashboard', 'Invoices', 'Customers', 'Vendors', 'Payments', 'Accounting', 'Reports'].map(
            (item, i) => (
              <p
                key={item}
                className={`mb-0.5 rounded px-1.5 py-1 text-[8px] ${
                  i === 0 ? 'bg-brand-600 text-white' : 'text-stone-400'
                }`}
              >
                {item}
              </p>
            ),
          )}
        </div>

        {/* mini content */}
        <div className="min-w-0 flex-1 bg-[#faf7f2] p-3">
          <div className="mb-2.5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-stone-900">Welcome back!</p>
              <p className="text-[7px] text-stone-500">
                Here&apos;s what&apos;s happening with your business today.
              </p>
            </div>
            <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[6px] font-medium text-stone-600">
              Sample data
            </span>
          </div>

          <div className="mb-2 grid grid-cols-3 gap-1.5">
            {[
              { label: 'Total Invoices', value: '₹12,48,000', delta: '+12%', tone: 'text-emerald-600' },
              { label: 'Payments Received', value: '₹8,32,000', delta: '+18%', tone: 'text-emerald-600' },
              { label: 'Pending Payments', value: '₹4,16,000', delta: '+5%', tone: 'text-amber-600' },
            ].map((tile) => (
              <div key={tile.label} className="rounded-md border border-stone-200 bg-white p-1.5">
                <p className="text-[6px] text-stone-500">{tile.label}</p>
                <p className="text-[10px] font-bold text-stone-900">{tile.value}</p>
                <p className={`text-[6px] ${tile.tone}`}>{tile.delta} from last month</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <div className="col-span-2 rounded-md border border-stone-200 bg-white p-2">
              <p className="mb-1.5 text-[7px] font-semibold text-stone-700">Sales Overview</p>
              <div className="flex h-12 items-end gap-1.5">
                {bars.map((value, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm bg-brand-600"
                    style={{ height: `${value}%`, opacity: 0.55 + i * 0.075 }}
                  />
                ))}
              </div>
              <div className="mt-1 flex justify-between text-[5px] text-stone-400">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-stone-200 bg-white p-2">
              <p className="mb-1.5 text-[7px] font-semibold text-stone-700">Invoice Status</p>
              <div className="flex items-center gap-1.5">
                <svg width="34" height="34" viewBox="0 0 36 36" aria-hidden="true">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#f5f1ea" strokeWidth="6" />
                  <circle
                    cx="18" cy="18" r="14" fill="none" stroke="#8b5a32" strokeWidth="6"
                    strokeDasharray="53 35" transform="rotate(-90 18 18)" strokeLinecap="round"
                  />
                  <circle
                    cx="18" cy="18" r="14" fill="none" stroke="#d6b593" strokeWidth="6"
                    strokeDasharray="22 66" strokeDashoffset="-53" transform="rotate(-90 18 18)" strokeLinecap="round"
                  />
                </svg>
                <div className="space-y-0.5 text-[5.5px]">
                  <p className="flex items-center gap-1 text-stone-600">
                    <span className="h-1 w-1 rounded-full bg-brand-600" /> Paid 60%
                  </p>
                  <p className="flex items-center gap-1 text-stone-600">
                    <span className="h-1 w-1 rounded-full bg-brand-300" /> Pending 25%
                  </p>
                  <p className="flex items-center gap-1 text-stone-600">
                    <span className="h-1 w-1 rounded-full bg-amber-500" /> Overdue 15%
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-1.5 rounded-md border border-stone-200 bg-white p-2">
            <p className="mb-1 text-[7px] font-semibold text-stone-700">Recent Invoices</p>
            <table className="w-full text-[5.5px]">
              <tbody>
                {[
                  ['INV-001', 'Modern Homes', '₹42,000', 'Paid', 'bg-emerald-100 text-emerald-700'],
                  ['INV-002', 'Urban Spaces', '₹28,500', 'Pending', 'bg-amber-100 text-amber-700'],
                  ['INV-003', 'WoodCraft Interiors', '₹76,000', 'Paid', 'bg-emerald-100 text-emerald-700'],
                ].map((row) => (
                  <tr key={row[0]} className="border-t border-stone-100">
                    <td className="py-0.5 text-stone-500">{row[0]}</td>
                    <td className="py-0.5 text-stone-700">{row[1]}</td>
                    <td className="py-0.5 text-right text-stone-800">{row[2]}</td>
                    <td className="py-0.5 text-right">
                      <span className={`rounded px-1 py-px ${row[4]}`}>{row[3]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
