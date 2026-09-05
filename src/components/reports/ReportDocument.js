'use client';

import { useAuth } from '@/context/AuthContext';

const ORG_NAME = 'Urban Furniture';
const ORG_TAGLINE = 'Accounting & Invoicing';

/** dd Mmm yyyy, hh:mm - stamped on every printed copy. */
function generatedStamp() {
  return new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Wraps a report so that Print / Save as PDF produces a proper document:
 * a letterhead, a metadata block, the report body, and a signed-off footer.
 *
 * On screen only the body shows - the letterhead and footer are print-only, and
 * the app chrome, filters and buttons are hidden by the print stylesheet.
 */
export default function ReportDocument({
  title,
  subtitle,
  meta = [],
  basis,
  children,
  className = '',
}) {
  const { user } = useAuth();

  const rows = [
    ...meta,
    { label: 'Generated on', value: generatedStamp() },
    { label: 'Prepared by', value: user?.name || user?.loginId || '-' },
  ];

  return (
    <div className={`report-document ${className}`}>
      {/* ---------------- print-only letterhead ---------------- */}
      <header className="report-letterhead hidden print:block">
        <div className="report-letterhead-top">
          <div>
            <p className="report-org">{ORG_NAME}</p>
            <p className="report-org-tagline">{ORG_TAGLINE}</p>
          </div>
          <div className="report-stamp">
            <p className="report-doc-type">Financial Report</p>
            <p className="report-doc-date">{generatedStamp()}</p>
          </div>
        </div>

        <h1 className="report-title">{title}</h1>
        {subtitle && <p className="report-subtitle">{subtitle}</p>}

        <dl className="report-meta">
          {rows.map((row) => (
            <div key={row.label} className="report-meta-item">
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      {children}

      {/* ---------------- print-only footer ---------------- */}
      <footer className="report-footer hidden print:block">
        <p className="report-basis">
          {basis ||
            'Figures are produced by the accounting system from posted journal entries.'}
        </p>
        <div className="report-signoff">
          <div className="report-signline">
            <span>Prepared by</span>
          </div>
          <div className="report-signline">
            <span>Reviewed by</span>
          </div>
        </div>
        <p className="report-confidential">
          {ORG_NAME} &middot; Confidential &middot; {title} &middot; Generated{' '}
          {generatedStamp()}
        </p>
      </footer>
    </div>
  );
}

/** A body section that should never be split across two printed pages. */
export function ReportBlock({ children, className = '' }) {
  return <div className={`report-block ${className}`}>{children}</div>;
}
