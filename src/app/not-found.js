import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-20">
      <div className="text-center">
        <p className="text-sm font-semibold text-brand-600">404</p>
        <h1 className="mt-1 text-xl font-semibold text-stone-900">Page not found</h1>
        <p className="mt-1 text-sm text-stone-500">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="mt-5 inline-block rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Go back
        </Link>
      </div>
    </div>
  );
}
