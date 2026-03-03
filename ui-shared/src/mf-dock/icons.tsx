type DockIconProps = {
  className?: string;
};

export function DockOpenInNewIcon({ className }: DockIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M14 4H20V10" />
      <path d="M20 4L11 13" />
      <path d="M10 6H6C4.9 6 4 6.9 4 8V18C4 19.1 4.9 20 6 20H16C17.1 20 18 19.1 18 18V14" />
    </svg>
  );
}

export function DockCloseIcon({ className }: DockIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6 6L18 18" />
      <path d="M18 6L6 18" />
    </svg>
  );
}
