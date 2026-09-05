export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-[#f2ece3] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-700 text-lg font-bold text-white shadow-md">
            UF
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-stone-900">Urban Furniture</h1>
          <p className="text-sm text-stone-500">Accounting &amp; Invoicing</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">{children}</div>
      </div>
    </div>
  );
}
