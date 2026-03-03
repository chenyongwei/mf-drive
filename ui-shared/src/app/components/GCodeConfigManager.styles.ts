export const GCODE_CONFIG_MANAGER_STYLES = `
  .gcode-config-manager-overlay {
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
    z-index: 1000;
  }
  .gcode-config-manager-modal {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    max-width: 900px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .gcode-config-manager-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }
  .gcode-config-manager-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
  }
  .close-button {
    background: none;
    border: none;
    font-size: 28px;
    color: #6b7280;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s;
  }
  .close-button:hover {
    background: #e5e7eb;
    color: #1f2937;
  }
  .gcode-config-manager-content {
    padding: 24px;
    overflow-y: auto;
  }
  .gcode-config-manager {
    display: flex;
    gap: 20px;
  }
  .config-list {
    flex: 1;
    display: flex;
    gap: 20px;
    overflow-y: auto;
    max-height: calc(100vh - 180px);
  }
  .config-sidebar {
    width: 300px;
    border-right: 1px solid #e5e7eb;
    padding-right: 15px;
  }
  .tab-buttons {
    display: flex;
    gap: 5px;
    margin-bottom: 15px;
  }
  .tab-button {
    flex: 1;
    padding: 8px;
    background: #f3f4f6;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .tab-button.active {
    background: #4f46e5;
    color: white;
  }
  .tab-button:hover:not(.active) {
    background: #e5e7eb;
  }
  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 10px;
    padding-bottom: 5px;
    border-bottom: 2px solid #e5e7eb;
  }
  .config-item {
    padding: 10px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .config-item + .config-item {
    margin-top: 8px;
  }
  .config-item:hover {
    background: #f9fafb;
    border-color: #4f46e5;
  }
  .config-item.selected {
    background: #eff6ff;
    border-color: #3b82f6;
  }
  .config-icon {
    font-size: 24px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3f4f6;
    border-radius: 6px;
  }
  .config-info {
    flex: 1;
  }
  .config-name {
    font-weight: 600;
    color: #1f2937;
  }
  .config-description {
    font-size: 12px;
    color: #64748b;
    margin-top: 2px;
  }
  .config-actions {
    display: flex;
    gap: 4px;
  }
  .action-button {
    padding: 4px 8px;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .action-button:hover {
    background: #f9fafb;
  }
  .device-section {
    margin-bottom: 20px;
  }
  .device-section:last-child {
    margin-bottom: 0;
  }
  .empty-state {
    padding: 20px;
    text-align: center;
    color: #64748b;
  }
  .new-button {
    width: 100%;
    padding: 12px;
    background: #4f46e5;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    margin-top: 10px;
  }
  .new-button:hover {
    background: #4338ca;
  }
`;
