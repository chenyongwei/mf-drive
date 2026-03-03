import type { ReactNode } from 'react';

type ConfigFormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
};

export function ConfigFormSection({ title, description, children, actions }: ConfigFormSectionProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {description ? <p className="mt-1 text-xs text-slate-600">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
