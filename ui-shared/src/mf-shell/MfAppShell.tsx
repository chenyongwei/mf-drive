import type { ReactNode } from 'react';
import type { AppId } from '@platform/contracts/generated/apps';
import { MfAppsDock } from '../mf-dock';

type MfAppShellProps = {
  currentAppId: AppId;
  children: ReactNode;
  className?: string;
  dockVariant?: 'fixed' | 'rail';
  dockContentReserveWidth?: number;
};

export function MfAppShell(props: MfAppShellProps) {
  const {
    currentAppId,
    children,
    className,
    dockVariant = 'fixed',
    dockContentReserveWidth,
  } = props;

  return (
    <div className={className}>
      {children}
      <MfAppsDock
        currentAppId={currentAppId}
        variant={dockVariant}
        contentReserveWidth={dockContentReserveWidth}
      />
    </div>
  );
}
