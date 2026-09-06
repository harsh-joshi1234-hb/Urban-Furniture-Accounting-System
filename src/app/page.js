import Link from 'next/link';
import LandingNav from '@/components/marketing/LandingNav';
import DashboardPreview from '@/components/marketing/DashboardPreview';
import Reveal from '@/components/marketing/Reveal';

export const metadata = {
  title: 'Urban Furniture — Furniture Business Management Made Simple',
  description:
    'Manage invoices, payments, inventory and accounts in one platform built for furniture businesses.',
};

const PILLARS = [
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
    label: 'Inventory',
    caption: 'Manage with Ease',
    path: 'M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9',
  },
  {
    label: 'Payments',
    caption: 'Get Paid Faster',
    path: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3M3.75 19.5h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z',
  },
];

const FEATURES = [
  {
    title: 'Sales & Invoicing',
    body: 'Raise sales orders, convert them to invoices in one click, and track what is confirmed, partially paid or settled.',
    href: '/sales/invoices',
  },
  {
    title: 'Purchases & Bills',
    body: 'Record purchase orders, turn them into vendor bills, and keep every payable visible before it falls due.',
    href: '/purchase/bills',
  },
  {
    title: 'Payments & Receipts',
    body: 'Take customer receipts and send vendor payments by bank, cash or online — allocation updates the document status for you.',
    href: '/sales/receipts',
  },
  {
    title: 'Double-Entry Accounting',
    body: 'A full chart of accounts, journals and journal entries. Confirming a document posts a balanced entry automatically.',
    href: '/account/journal-entries',
  },
  {
    title: 'Budgets & Analytics',
    body: 'Track analytical budgets against real achievement, with committed, achieved and remaining computed for you.',
    href: '/account/budgets',
  },
  {
    title: 'Financial Reports',
    body: 'Profit & loss, balance sheet and budget reports from posted entries — printable as clean PDF documents.',
    href: '/reports/profit-and-loss',
  },
];

const AUDIENCES = [
  {
    title: 'Furniture Retailers',
    body: 'Showroom sales, customer invoices and receipts, with outstanding balances always in view.',
  },
  {
    title: 'Manufacturers',
    body: 'Purchase orders and vendor bills for raw material, tracked against analytical budgets per project.',
  },
  {
    title: 'Interior Studios',
    body: 'Project-level budgets, client invoicing and a customer portal so clients can pay their own dues.',
  },
];

const PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    note: 'For a single owner getting started',
    points: ['Contacts & products', 'Sales orders and invoices', 'Customer portal', 'Email password reset'],
    cta: 'Get started',
    featured: false,
  },
  {
    name: 'Business',
    price: 'Contact us',
    note: 'For growing furniture businesses',
    points: [
      'Everything in Starter',
      'Purchases, bills and vendor payments',
      'Full double-entry accounting',
      'Budgets and financial reports',
    ],
    cta: 'Get started',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Contact us',
    note: 'For multi-branch operations',
    points: ['Everything in Business', 'Role-based access control', 'Audit log of every change', 'Priority support'],
    cta: 'Talk to us',
    featured: false,
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#faf7f2]">
      <LandingNav />

      {/* ═══════════ HERO ═══════════ */}
      <section id="home" className="relative overflow-hidden">
        <div
          className="absolute inset-y-0 right-0 hidden w-[52%] bg-cover bg-center lg:block"
          style={{ backgroundImage: "url('/images/furniture/hero-living-room.jpg')" }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-y-0 right-0 hidden w-[52%] bg-gradient-to-r from-[#faf7f2] via-[#faf7f2]/70 to-[#faf7f2]/20 lg:block"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-[#efe6d9]/60"
          aria-hidden="true"
        />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
          <div>
            <div className="mb-4 h-px w-10 bg-brand-600" aria-hidden="true" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
              Simple accounts. Stronger businesses.
            </p>

            <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-stone-900 sm:text-5xl xl:text-6xl">
              Furniture Business
              <br />
              Management
              <br />
              <span className="text-brand-700">Made Simple</span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-stone-600">
              Manage your invoices, payments, inventory and accounts — all in one powerful
              platform built for modern furniture businesses.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="hover-cta inline-flex h-12 items-center gap-2 rounded-lg bg-brand-700 px-6 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
              >
                Get Started <span className="cta-arrow" aria-hidden="true">→</span>
              </Link>
              <a
                href="#features"
                className="hover-cta inline-flex h-12 items-center gap-2 rounded-lg border border-stone-300 bg-white px-6 text-sm font-semibold text-stone-700 hover:bg-stone-50"
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-700 text-[9px] text-white"
                  aria-hidden="true"
                >
                  ▶
                </span>
                Watch Demo
              </a>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-2" aria-hidden="true">
                {['#8b5a32', '#a9713f', '#c08f63'].map((tone) => (
                  <span
                    key={tone}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#faf7f2] text-[10px] font-semibold text-white"
                    style={{ background: tone }}
                  >
                    UF
                  </span>
                ))}
              </div>
              <p className="text-sm leading-snug text-stone-600">
                Trusted by furniture businesses
                <br />
                across India
              </p>
            </div>
          </div>

          <div className="relative">
            <p className="mb-4 hidden text-right font-serif text-sm italic leading-tight text-brand-700/80 lg:block">
              More than Furniture
              <br />A Brighter Tomorrow
            </p>
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* ═══════════ PILLAR STRIP ═══════════ */}
      <section className="border-y border-stone-200 bg-[#f5efe6]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-10 gap-y-6 px-4 py-8 sm:px-6">
          {PILLARS.map((pillar) => (
            <div key={pillar.label} className="hover-lift flex items-center gap-3 rounded-xl border border-transparent p-2">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e6dbcc] text-brand-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                  strokeWidth={1.6} stroke="currentColor" className="h-6 w-6" aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={pillar.path} />
                </svg>
              </span>
              <span>
                <span className="block text-sm font-bold text-stone-900">{pillar.label}</span>
                <span className="block text-xs text-stone-500">{pillar.caption}</span>
              </span>
            </div>
          ))}

          <figure className="m-0 ml-auto max-w-xs border-l border-stone-300 pl-6">
            <blockquote className="text-sm font-medium italic leading-snug text-stone-700">
              &ldquo;Better Furniture Businesses Build a Brighter Tomorrow.&rdquo;
            </blockquote>
            <div className="mt-2 h-px w-8 bg-brand-600" aria-hidden="true" />
          </figure>
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
          <div>
            <div className="mb-4 h-px w-10 bg-brand-600" aria-hidden="true" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
              Built for furniture businesses
            </p>
            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-stone-900 sm:text-4xl">
              Everything You Need
              <br />
              in <span className="text-brand-700">One Place</span>
            </h2>
          </div>
          <div>
            <p className="text-base leading-relaxed text-stone-600">
              From invoicing to inventory, Urban Furniture helps you streamline your operations
              and focus on what you do best — creating beautiful spaces.
            </p>
            <Link
              href="/signup"
              className="hover-cta mt-5 inline-flex h-11 items-center gap-2 rounded-lg bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800"
            >
              Explore Features <span className="cta-arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <Reveal as="li" key={feature.title} delay={index * 70}>
              <div className="hover-lift h-full rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
                <h3 className="text-base font-semibold text-stone-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{feature.body}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* ═══════════ FOR BUSINESSES ═══════════ */}
      <section id="for-businesses" className="border-y border-stone-200 bg-[#f5efe6] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-4 h-px w-10 bg-brand-600" aria-hidden="true" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
            For businesses
          </p>
          <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            Whatever you build, the books stay <span className="text-brand-700">straight</span>
          </h2>

          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {AUDIENCES.map((audience, index) => (
              <Reveal as="li" key={audience.title} delay={index * 90}>
                <div className="hover-lift h-full rounded-xl border border-stone-200 bg-white p-6">
                  <h3 className="text-base font-semibold text-stone-900">{audience.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">{audience.body}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ═══════════ PRICING ═══════════ */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-4 h-px w-10 bg-brand-600" aria-hidden="true" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
          Pricing
        </p>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          Simple plans, <span className="text-brand-700">no surprises</span>
        </h2>

        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {PLANS.map((plan, planIndex) => (
            <Reveal as="li" key={plan.name} delay={planIndex * 90} className="flex">
              <div
                className={`hover-lift flex w-full flex-col rounded-xl border bg-white p-6 ${
                  plan.featured
                    ? 'border-brand-600 shadow-md ring-1 ring-brand-100'
                    : 'border-stone-200'
                }`}
              >
              {plan.featured && (
                <span className="mb-3 self-start rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700">
                  Most popular
                </span>
              )}
              <h3 className="text-base font-semibold text-stone-900">{plan.name}</h3>
              <p className="mt-1 text-2xl font-bold tracking-tight text-stone-900">{plan.price}</p>
              <p className="mt-1 text-xs text-stone-500">{plan.note}</p>
              <ul className="mt-4 flex-1 space-y-2">
                {plan.points.map((point) => (
                  <li key={point} className="flex gap-2 text-sm text-stone-600">
                    <span className="text-brand-600" aria-hidden="true">✓</span>
                    {point}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`hover-cta mt-6 inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold ${
                  plan.featured
                    ? 'bg-brand-700 text-white hover:bg-brand-800'
                    : 'border border-stone-300 text-stone-700 hover:bg-stone-50'
                }`}
              >
                {plan.cta}
              </Link>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* ═══════════ ABOUT ═══════════ */}
      <section id="about" className="border-t border-stone-200 bg-[#f5efe6] py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="mb-4 h-px w-10 bg-brand-600" aria-hidden="true" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
              About
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              Spaces that work for your <span className="text-brand-700">tomorrow</span>
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-stone-600">
              Urban Furniture is an accounting platform for the furniture trade — master data,
              sales, purchases, payments, double-entry accounting and reporting, in one place.
              Every figure you see is produced by the accounting engine, never estimated.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="hover-cta inline-flex h-11 items-center rounded-lg bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800"
              >
                Create an account
              </Link>
              <Link
                href="/login"
                className="hover-cta inline-flex h-11 items-center rounded-lg border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-stone-200 shadow-sm">
            {/* Local licensed asset - see public/images/furniture/CREDITS.md */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/furniture/living-set.jpg"
              alt="A furnished living room"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="border-t border-stone-200 bg-[#faf7f2]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 text-xs font-bold text-white">
              UF
            </span>
            <span>
              <span className="block text-sm font-semibold text-stone-900">Urban Furniture</span>
              <span className="block text-[11px] text-stone-500">Accounting &amp; Invoicing</span>
            </span>
          </div>

          <nav className="flex flex-wrap gap-5 text-sm text-stone-600">
            <a href="#features" className="hover:text-brand-700">Features</a>
            <a href="#for-businesses" className="hover:text-brand-700">For Businesses</a>
            <a href="#pricing" className="hover:text-brand-700">Pricing</a>
            <a href="#about" className="hover:text-brand-700">About</a>
            <Link href="/login" className="hover:text-brand-700">Sign In</Link>
          </nav>

          <p className="text-[11px] text-stone-500">
            © {new Date().getFullYear()} Urban Furniture. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

