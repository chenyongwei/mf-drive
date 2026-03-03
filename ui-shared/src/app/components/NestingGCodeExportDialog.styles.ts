import {
  buildDialogFooterStyles,
  buildDialogOverlayStyles,
  COMMON_DIALOG_BUTTON_STYLES,
  COMMON_FORM_GROUP_STYLES,
} from "./common/dialogStyleFragments";

export const NESTING_GCODE_EXPORT_STYLES = `
        ${buildDialogOverlayStyles(".nesting-export-overlay")}
        .nesting-export-dialog {
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
        .export-header {
          padding: 16px 24px;
          border-bottom: 1px solid #e5e7eb;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .export-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: white;
        }
        .export-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }
        ${COMMON_FORM_GROUP_STYLES}
        .config-preview {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px;
          margin-top: 12px;
        }
        .config-preview-title {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }
        .config-preview-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        .config-item {
          font-size: 12px;
          color: #6b7280;
        }
        .config-item span {
          color: #374151;
          font-weight: 500;
        }
        .export-summary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          padding: 16px;
          color: white;
          margin-bottom: 16px;
        }
        .export-summary-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .export-summary-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .export-stat {
          text-align: center;
        }
        .export-stat-value {
          font-size: 20px;
          font-weight: 700;
        }
        .export-stat-label {
          font-size: 11px;
          opacity: 0.9;
        }
        .progress-section {
          background: #f9fafb;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }
        .progress-bar {
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          transition: width 0.3s ease;
        }
        .progress-text {
          text-align: center;
          font-size: 12px;
          color: #6b7280;
        }
        ${buildDialogFooterStyles(".export-footer")}
        ${COMMON_DIALOG_BUTTON_STYLES}
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
      `;
