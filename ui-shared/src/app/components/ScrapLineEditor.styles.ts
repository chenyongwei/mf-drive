import {
  buildDialogFooterStyles,
  buildDialogOverlayStyles,
  COMMON_DIALOG_BUTTON_STYLES,
  COMMON_FORM_GROUP_STYLES,
} from "./common/dialogStyleFragments";

export const SCRAP_LINE_EDITOR_CSS = `
  ${buildDialogOverlayStyles(".scrap-line-editor-overlay")}
  .scrap-line-editor {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .editor-header {
    padding: 16px 24px;
    border-bottom: 1px solid #e5e7eb;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  .editor-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: white;
  }
  .editor-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  }
  .form-section {
    margin-bottom: 20px;
  }
  .form-section-title {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 12px;
  }
  ${COMMON_FORM_GROUP_STYLES}
  .form-row {
    display: flex;
    gap: 12px;
  }
  .form-row .form-group {
    flex: 1;
  }
  .shape-preview {
    border: 2px dashed #e5e7eb;
    border-radius: 8px;
    padding: 20px;
    margin-top: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 120px;
    background: #f9fafb;
  }
  .preview-line {
    width: 80px;
    height: 4px;
    background: #8b5cf6;
  }
  .preview-triangle {
    width: 0;
    height: 0;
    border-left: 40px solid transparent;
    border-right: 40px solid transparent;
    border-bottom: 60px solid #8b5cf6;
  }
  .preview-trapezoid {
    width: 80px;
    height: 50px;
    background: linear-gradient(to bottom, #8b5cf6 0%, #8b5cf6 30%, transparent 30%);
    clip-path: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%);
  }
  .preview-circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: #8b5cf6;
  }
  ${buildDialogFooterStyles(".editor-footer")}
  ${COMMON_DIALOG_BUTTON_STYLES}
`;
