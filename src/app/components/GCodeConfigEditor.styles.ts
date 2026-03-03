import { buildDialogOverlayStyles } from "./common/dialogStyleFragments";

export const GCODE_CONFIG_EDITOR_STYLES = `
  ${buildDialogOverlayStyles(".gcode-config-editor-overlay")}
  .gcode-config-editor {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    max-width: 800px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .gcode-config-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }
  .gcode-config-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
  }
  .gcode-config-body {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  }
  .gcode-config-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding: 16px 24px;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
  }
  .config-section {
    margin-bottom: 20px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
  }
  .config-section h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    padding: 12px 16px;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    cursor: pointer;
  }
  .section-header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }
  .toggle-icon {
    font-size: 12px;
    color: #6b7280;
  }
  .section-content {
    padding: 16px;
  }
  .form-row {
    display: flex;
    gap: 16px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }
  .form-row:last-child {
    margin-bottom: 0;
  }
  .form-row label {
    flex: 1;
    min-width: 200px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #374151;
  }
  .form-row input[type="number"],
  .form-row select,
  .form-row textarea {
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    min-width: 120px;
  }
  .form-row input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
  .form-row textarea {
    width: 100%;
    min-width: 300px;
    resize: vertical;
    font-family: 'Courier New', monospace;
    font-size: 12px;
  }
  .lead-config {
    margin-bottom: 16px;
  }
  .btn-primary {
    padding: 10px 20px;
    background: #4f46e5;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-primary:hover {
    background: #4338ca;
  }
  .btn-secondary {
    padding: 10px 20px;
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-secondary:hover {
    background: #f9fafb;
  }
`;
