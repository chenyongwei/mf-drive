import type { ReactNode } from 'react';

type MfPageShellProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  mini?: boolean;
  reserveDockSpace?: boolean;
};

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function MfPageShell(props: MfPageShellProps) {
  const {
    title,
    subtitle,
    actions,
    children,
    className,
    headerClassName,
    contentClassName,
    mini = false,
    reserveDockSpace = true,
  } = props;

  const rootClassName = cx(
    'min-h-screen bg-mf-bg text-mf-text',
    mini ? 'px-2 py-2' : reserveDockSpace ? 'px-4 py-4 pr-18' : 'px-4 py-4',
    className,
  );

  return (
    <div className={rootClassName}>
      {(title || subtitle || actions) ? (
        <header className={cx('mb-3 rounded-xl border border-mf-border bg-mf-surface px-4 py-3 shadow-sm', headerClassName)}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              {title ? <h1 className="m-0 text-2xl font-semibold text-mf-text">{title}</h1> : null}
              {subtitle ? <p className="mt-1 text-sm text-mf-muted">{subtitle}</p> : null}
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
          </div>
        </header>
      ) : null}

      <main className={cx('grid gap-3', contentClassName)}>{children}</main>
    </div>
  );
}
