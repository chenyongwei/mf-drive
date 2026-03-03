export const COMMON_FORM_GROUP_STYLES = `
  .form-group {
    margin-bottom: 16px;
  }
  .form-group label {
    display: block;
    font-size: 13px;
    color: #6b7280;
    margin-bottom: 6px;
  }
  .form-group input,
  .form-group select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
  }
`;

export function buildDialogOverlayStyles(selector: string, zIndex = 1100): string {
  return `
  ${selector} {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: ${zIndex};
  }
`;
}

export function buildDialogFooterStyles(selector: string): string {
  return `
  ${selector} {
    padding: 16px 24px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
`;
}

export const COMMON_DIALOG_BUTTON_STYLES = `
  .btn {
    padding: 10px 24px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
  }
  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
  .btn-secondary {
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
  }
  .btn-secondary:hover {
    background: #f9fafb;
  }
`;
