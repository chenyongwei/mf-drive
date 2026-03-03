import type { ReactNode } from 'react';

type MfStatusTone = 'info' | 'success' | 'warning' | 'danger';

type MfStatusBannerProps = {
  tone?: MfStatusTone;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
};

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

function toneClass(tone: MfStatusTone): string {
  if (tone === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (tone === 'warning') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (tone === 'danger') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-sky-200 bg-sky-50 text-sky-700';
}

export function MfStatusBanner(props: MfStatusBannerProps) {
  const { tone = 'info', title, children, className } = props;

  return (
    <div className={cx('rounded-md border px-3 py-2 text-xs', toneClass(tone), className)}>
      {title ? <strong className="mr-1">{title}</strong> : null}
      <span>{children}</span>
    </div>
  );
}
