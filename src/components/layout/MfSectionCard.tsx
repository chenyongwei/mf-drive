import type { ReactNode } from 'react';

type MfSectionCardProps = {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function MfSectionCard(props: MfSectionCardProps) {
  const { title, description, actions, children, className, bodyClassName } = props;

  return (
    <section className={cx('rounded-xl border border-mf-border bg-mf-surface p-3 shadow-sm', className)}>
      {(title || description || actions) ? (
        <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            {title ? <h2 className="m-0 text-base font-semibold text-mf-text">{title}</h2> : null}
            {description ? <p className="mt-1 text-xs text-mf-muted">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}

      <div className={cx('grid gap-2', bodyClassName)}>{children}</div>
    </section>
  );
}
