import type { ButtonHTMLAttributes, ReactNode } from 'react';

type MfButtonTone = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning';
type MfButtonSize = 'sm' | 'md' | 'lg';

type MfButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: MfButtonTone;
  size?: MfButtonSize;
  block?: boolean;
  busy?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
};

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

function toneClass(tone: MfButtonTone): string {
  if (tone === 'secondary') return 'border border-mf-border-strong bg-mf-surface text-mf-text hover:bg-mf-bg-soft';
  if (tone === 'ghost') return 'border border-transparent bg-transparent text-mf-muted hover:border-mf-border hover:bg-mf-bg-soft';
  if (tone === 'danger') return 'border border-red-300 bg-red-50 text-red-700 hover:bg-red-100';
  if (tone === 'success') return 'border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100';
  if (tone === 'warning') return 'border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100';
  return 'border border-mf-primary bg-mf-primary text-white hover:bg-mf-primary-strong';
}

function sizeClass(size: MfButtonSize): string {
  if (size === 'sm') return 'h-7 px-2 text-xs';
  if (size === 'lg') return 'h-10 px-4 text-sm';
  return 'h-8 px-3 text-xs';
}

export function MfButton(props: MfButtonProps) {
  const {
    tone = 'primary',
    size = 'md',
    block = false,
    busy = false,
    leading,
    trailing,
    className,
    children,
    disabled,
    ...rest
  } = props;

  return (
    <button
      {...rest}
      className={cx(
        'inline-flex items-center justify-center gap-1 rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        toneClass(tone),
        sizeClass(size),
        block && 'w-full',
        className,
      )}
      disabled={disabled || busy}
    >
      {leading ? <span className="inline-flex items-center">{leading}</span> : null}
      <span>{busy ? '处理中...' : children}</span>
      {trailing ? <span className="inline-flex items-center">{trailing}</span> : null}
    </button>
  );
}
