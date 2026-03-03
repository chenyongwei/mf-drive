import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MfMiniHost } from './MfMiniHost';
import type { MiniLaunchSession } from './types';

const SESSION: MiniLaunchSession = {
  targetAppId: 'aps',
  targetRoute: '/aps/plans',
  title: 'APS 排产',
};

describe('MfMiniHost', () => {
  it('renders accessible header actions and closes panel after opening app in new window', () => {
    const onClose = vi.fn();
    const onOpenWindow = vi.fn();

    render(
      <MfMiniHost
        session={SESSION}
        sourceAppId="ordering"
        onClose={onClose}
        onOpenWindow={onOpenWindow}
      />,
    );

    expect(screen.getByRole('group', { name: '面板操作' })).toBeInTheDocument();

    const openButton = screen.getByTestId('mf-mini-open-window');
    const closeButton = screen.getByTestId('mf-mini-close');

    expect(openButton).toHaveAttribute('aria-label', '新窗口');
    expect(openButton).toHaveAttribute('title', '新窗口');
    expect(openButton.querySelector('.mf-mini-action-icon svg')).not.toBeNull();

    expect(closeButton).toHaveAttribute('aria-label', '关闭');
    expect(closeButton).toHaveAttribute('title', '关闭');
    expect(closeButton.querySelector('.mf-mini-action-icon svg')).not.toBeNull();

    fireEvent.click(openButton);

    expect(onOpenWindow).toHaveBeenCalledWith(SESSION);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
