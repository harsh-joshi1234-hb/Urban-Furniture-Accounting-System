'use client';

const baseInput =
  'block w-full rounded-md border-0 px-3 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-slate-50 disabled:text-slate-500';

export function Label({ htmlFor, children, required }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}

export function FieldWrapper({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
  className = '',
}) {
  return (
    <div className={className}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      <div className={label ? 'mt-1.5' : ''}>{children}</div>
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextField({ label, name, error, hint, required, className = '', ...props }) {
  return (
    <FieldWrapper
      label={label}
      htmlFor={name}
      required={required}
      error={error}
      hint={hint}
      className={className}
    >
      <input
        id={name}
        name={name}
        className={`${baseInput} ${error ? 'ring-red-400' : ''}`}
        aria-invalid={Boolean(error)}
        {...props}
      />
    </FieldWrapper>
  );
}

export function SelectField({
  label,
  name,
  error,
  hint,
  required,
  options = [],
  placeholder = 'Select...',
  className = '',
  children,
  ...props
}) {
  return (
    <FieldWrapper
      label={label}
      htmlFor={name}
      required={required}
      error={error}
      hint={hint}
      className={className}
    >
      <select
        id={name}
        name={name}
        className={`${baseInput} ${error ? 'ring-red-400' : ''}`}
        aria-invalid={Boolean(error)}
        {...props}
      >
        {placeholder !== null && <option value="">{placeholder}</option>}
        {children ??
          options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
      </select>
    </FieldWrapper>
  );
}

export function TextAreaField({
  label,
  name,
  error,
  hint,
  required,
  className = '',
  ...props
}) {
  return (
    <FieldWrapper
      label={label}
      htmlFor={name}
      required={required}
      error={error}
      hint={hint}
      className={className}
    >
      <textarea
        id={name}
        name={name}
        rows={3}
        className={`${baseInput} ${error ? 'ring-red-400' : ''}`}
        {...props}
      />
    </FieldWrapper>
  );
}

export function CheckboxField({ label, name, className = '', ...props }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        id={name}
        name={name}
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
        {...props}
      />
      <label htmlFor={name} className="text-sm text-slate-700">
        {label}
      </label>
    </div>
  );
}

export { baseInput };
