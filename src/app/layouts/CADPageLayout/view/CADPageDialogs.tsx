import React from "react";
import { OWNERSHIP_TARGET_NEW_FILE } from "../../../components/CAD/utils/fileOwnershipResolver";

interface FileNameDialogState {
  title: string;
  value: string;
}

interface OwnershipCandidate {
  fileId: string;
  fileName: string;
}

interface OwnershipDialogState {
  isOpen: boolean;
  selectedTargetId: string;
  candidates: OwnershipCandidate[];
}

interface CADPageDialogsProps {
  theme: "dark" | "light";
  ownershipDialog: OwnershipDialogState;
  onOwnershipDialogKeyDownCapture: (event: React.KeyboardEvent<HTMLElement>) => void;
  onOwnershipDialogSelectionChange: (targetId: string) => void;
  closeOwnershipDialog: () => void;
  confirmOwnershipDialog: () => void;
  fileNameDialog: FileNameDialogState | null;
  onFileNameDialogKeyDownCapture: (event: React.KeyboardEvent<HTMLElement>) => void;
  onFileNameDialogValueChange: (value: string) => void;
  closeFileNameDialog: () => void;
  confirmFileNameDialog: () => void;
}

const panelStyle = (theme: "dark" | "light"): React.CSSProperties => ({
  background: theme === "dark" ? "#1f1f22" : "#ffffff",
  color: theme === "dark" ? "#f1f5f9" : "#0f172a",
  border: theme === "dark" ? "1px solid #3f3f46" : "1px solid #d1d5db",
  borderRadius: "10px",
  boxShadow:
    theme === "dark"
      ? "0 24px 48px rgba(0, 0, 0, 0.45)"
      : "0 20px 40px rgba(15, 23, 42, 0.2)",
  padding: "16px",
});

const secondaryButtonStyle = (theme: "dark" | "light"): React.CSSProperties => ({
  height: "34px",
  minWidth: "72px",
  borderRadius: "7px",
  border: theme === "dark" ? "1px solid #52525b" : "1px solid #cbd5e1",
  background: theme === "dark" ? "#27272a" : "#f8fafc",
  color: theme === "dark" ? "#e4e4e7" : "#334155",
  cursor: "pointer",
});

const primaryButtonStyle: React.CSSProperties = {
  height: "34px",
  minWidth: "72px",
  borderRadius: "7px",
  border: "none",
  background: "#3b82f6",
  color: "#ffffff",
  cursor: "pointer",
};

export const CADPageDialogs: React.FC<CADPageDialogsProps> = ({
  theme,
  ownershipDialog,
  onOwnershipDialogKeyDownCapture,
  onOwnershipDialogSelectionChange,
  closeOwnershipDialog,
  confirmOwnershipDialog,
  fileNameDialog,
  onFileNameDialogKeyDownCapture,
  onFileNameDialogValueChange,
  closeFileNameDialog,
  confirmFileNameDialog,
}) => {
  return (
    <>
      {ownershipDialog.isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1995,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            data-testid="ownership-dialog"
            onKeyDownCapture={onOwnershipDialogKeyDownCapture}
            style={{ ...panelStyle(theme), width: "min(460px, calc(100vw - 32px))" }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>
              图形跨多个文件，请选择归属
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ownershipDialog.candidates.map((candidate) => {
                const checked = ownershipDialog.selectedTargetId === candidate.fileId;
                return (
                  <label
                    key={candidate.fileId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 10px",
                      borderRadius: 8,
                      border:
                        theme === "dark"
                          ? "1px solid rgba(82,82,91,0.8)"
                          : "1px solid rgba(203,213,225,0.95)",
                      background: checked
                        ? theme === "dark"
                          ? "rgba(59,130,246,0.16)"
                          : "rgba(59,130,246,0.08)"
                        : "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="ownership-target"
                      value={candidate.fileId}
                      data-testid={`ownership-dialog-option-${candidate.fileId}`}
                      checked={checked}
                      onChange={() => onOwnershipDialogSelectionChange(candidate.fileId)}
                    />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{candidate.fileName}</span>
                  </label>
                );
              })}
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: 8,
                  border:
                    theme === "dark"
                      ? "1px solid rgba(82,82,91,0.8)"
                      : "1px solid rgba(203,213,225,0.95)",
                  background:
                    ownershipDialog.selectedTargetId === OWNERSHIP_TARGET_NEW_FILE
                      ? theme === "dark"
                        ? "rgba(59,130,246,0.16)"
                        : "rgba(59,130,246,0.08)"
                      : "transparent",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="ownership-target"
                  value={OWNERSHIP_TARGET_NEW_FILE}
                  data-testid={`ownership-dialog-option-${OWNERSHIP_TARGET_NEW_FILE}`}
                  checked={ownershipDialog.selectedTargetId === OWNERSHIP_TARGET_NEW_FILE}
                  onChange={() =>
                    onOwnershipDialogSelectionChange(OWNERSHIP_TARGET_NEW_FILE)
                  }
                />
                <span style={{ fontSize: 13, fontWeight: 500 }}>新建文件</span>
              </label>
            </div>
            <div
              style={{
                marginTop: 14,
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
              }}
            >
              <button
                type="button"
                data-testid="ownership-dialog-cancel"
                onClick={closeOwnershipDialog}
                style={secondaryButtonStyle(theme)}
              >
                取消
              </button>
              <button
                type="button"
                data-testid="ownership-dialog-confirm"
                onClick={confirmOwnershipDialog}
                style={primaryButtonStyle}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {fileNameDialog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            data-testid="file-name-dialog"
            onKeyDownCapture={onFileNameDialogKeyDownCapture}
            style={{ ...panelStyle(theme), width: "min(420px, calc(100vw - 32px))" }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>
              {fileNameDialog.title}
            </div>
            <input
              autoFocus
              value={fileNameDialog.value}
              data-testid="file-name-dialog-input"
              onChange={(event) => onFileNameDialogValueChange(event.target.value)}
              style={{
                width: "100%",
                height: "38px",
                borderRadius: "8px",
                border: theme === "dark" ? "1px solid #52525b" : "1px solid #cbd5e1",
                background: theme === "dark" ? "#111827" : "#ffffff",
                color: theme === "dark" ? "#f8fafc" : "#0f172a",
                padding: "0 10px",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <div
              style={{
                marginTop: 14,
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
              }}
            >
              <button
                type="button"
                data-testid="file-name-dialog-cancel"
                onClick={closeFileNameDialog}
                style={secondaryButtonStyle(theme)}
              >
                取消
              </button>
              <button
                type="button"
                data-testid="file-name-dialog-confirm"
                onClick={confirmFileNameDialog}
                style={primaryButtonStyle}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

