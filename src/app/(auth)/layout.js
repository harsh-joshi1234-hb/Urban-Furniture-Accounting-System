import Link from 'next/link';

const FEATURES = [
  {
    label: 'Invoicing',
    caption: 'Create & Track',
    path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    label: 'Accounting',
    caption: 'Stay Compliant',
    path: 'M7 16V9m5 7V5m5 11v-4M4.5 20h15a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0019.5 4h-15A1.5 1.5 0 003 5.5v13A1.5 1.5 0 004.5 20z',
  },
  {
    label: 'Payments',
    caption: 'Get Paid Faster',
    path: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3M3.75 19.5h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z',
  },
];

/**
 * Split-screen shell for every auth screen: a furniture showroom on the left,
 * the form on the right. The hero collapses away below `lg` so small screens
 * get a clean single-column form.
 */
export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-1 bg-[#f2ece3]">
      {/* ---------------- brand / hero ---------------- */}
      <section className="relative hidden w-[52%] overflow-hidden bg-[#efe7dc] lg:flex lg:flex-col">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/furniture/hero-living-room.jpg')" }}
          aria-hidden="true"
        />
        {/* Warm scrim so the copy stays readable over the photo */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#f6f0e7]/95 via-[#f6f0e7]/74 to-[#f6f0e7]/10"
          aria-hidden="true"
        />

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <div>
            <Link href="/login" className="inline-flex items-center gap-3.5">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-700 text-base font-bold text-white shadow-md">
                UF
              </span>
              <span>
                <span className="block text-xl font-bold tracking-tight text-stone-900">
                  Urban Furniture
                </span>
                <span className="block text-sm text-stone-600">Accounting &amp; Invoicing</span>
              </span>
            </Link>

            <div className="mt-14 max-w-lg">
              <div className="mb-4 h-px w-10 bg-brand-600" aria-hidden="true" />
              <p className="text-[11px] font-semibold uppercase leading-relaxed tracking-[0.22em] text-stone-500">
                Furniture business
                <br />
                made simple
              </p>

              <h1 className="mt-5 text-5xl font-bold leading-[1.08] tracking-tight text-stone-900 xl:text-6xl">
                Manage
                <br />
                Finances for a
                <br />
                <span className="text-brand-700">Better Tomorrow</span>
              </h1>

              <p className="mt-6 max-w-md text-base leading-relaxed text-stone-600">
                All your invoices, payments, inventory and accounts — in one powerful
                platform built for furniture businesses.
              </p>

              <ul className="mt-9 flex flex-wrap gap-8">
                {FEATURES.map((feature) => (
                  <li key={feature.label}>
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e6dbcc] text-brand-700">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.6}
                        stroke="currentColor"
                        className="h-6 w-6"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d={feature.path} />
                      </svg>
                    </span>
                    <p className="mt-3 text-sm font-semibold text-stone-900">{feature.label}</p>
                    <p className="text-xs text-stone-500">{feature.caption}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <figure className="m-0 max-w-sm">
            <div className="mb-3 h-px w-8 bg-stone-400" aria-hidden="true" />
            <blockquote className="text-sm italic leading-relaxed text-stone-600">
              &ldquo;Better Furniture Businesses Build a Brighter Tomorrow.&rdquo;
            </blockquote>
          </figure>
        </div>
      </section>

      {/* ---------------- form panel ---------------- */}
      <section className="relative flex flex-1 flex-col justify-between overflow-hidden px-4 py-8 sm:px-8">
        {/* soft decorative discs, echoing the showroom light */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#e8ddcd]/70"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-[#e8ddcd]/50"
          aria-hidden="true"
        />

        <p className="relative z-10 hidden text-right font-serif text-lg italic leading-tight text-brand-700/80 sm:block">
          Furniture
          <br />
          Builds
          <br />
          Better Lives
        </p>

        <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 items-center py-8">
          <div className="w-full rounded-2xl border border-white/70 bg-white/85 p-7 shadow-[0_8px_40px_rgba(28,25,23,0.10)] backdrop-blur sm:p-9">
            {children}
          </div>
        </div>

        <footer className="relative z-10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500">
          <span>© 2024 Urban Furniture. All rights reserved.</span>
          <span className="hidden sm:inline">
            A smarter way to manage your furniture business.
          </span>
        </footer>
      </section>
    </div>
  );
}
