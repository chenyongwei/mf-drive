import type { ReactNode } from 'react';

type MfFieldProps = {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function MfField(props: MfFieldProps) {
  const { label, hint, error, required = false, children, className } = props;

  return (
    <label className={cx('grid gap-1 text-xs text-mf-muted', className)}>
      {label ? (
        <span className="font-medium text-mf-text">
          {label}
          {required ? <span className="ml-0.5 text-red-600">*</span> : null}
        </span>
      ) : null}
      {children}
      {error ? <span className="text-xs text-red-700">{error}</span> : hint ? <span className="text-xs text-mf-muted">{hint}</span> : null}
    </label>
  );
}
