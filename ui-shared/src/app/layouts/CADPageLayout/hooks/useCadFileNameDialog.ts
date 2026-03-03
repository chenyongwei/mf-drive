import { useCallback, useEffect, useState } from "react";

interface FileNameDialogState {
  title: string;
  value: string;
  defaultName: string;
  resolve: (value: string | null) => void;
}

export const useCadFileNameDialog = () => {
  const [fileNameDialog, setFileNameDialog] = useState<FileNameDialogState | null>(null);

  const requestFileName = useCallback(
    (defaultName: string, title = "请输入新文件名") =>
      new Promise<string | null>((resolve) => {
        setFileNameDialog({ title, value: defaultName, defaultName, resolve });
      }),
    [],
  );

  const closeFileNameDialog = useCallback(() => {
    setFileNameDialog((prev) => {
      if (prev) prev.resolve(null);
      return null;
    });
  }, []);

  const confirmFileNameDialog = useCallback(() => {
    setFileNameDialog((prev) => {
      if (!prev) return null;
      const trimmed = prev.value.trim();
      prev.resolve(trimmed.length > 0 ? trimmed : prev.defaultName);
      return null;
    });
  }, []);

  const onFileNameDialogValueChange = useCallback((nextValue: string) => {
    setFileNameDialog((prev) => (prev ? { ...prev, value: nextValue } : prev));
  }, []);

  const onFileNameDialogKeyDownCapture = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (!fileNameDialog || event.nativeEvent.isComposing) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeFileNameDialog();
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        confirmFileNameDialog();
      }
    },
    [fileNameDialog, closeFileNameDialog, confirmFileNameDialog],
  );

  useEffect(() => {
    if (!fileNameDialog) return;
    const onWindowKeyDown = (event: KeyboardEvent) => {
      if ((event as KeyboardEvent & { isComposing?: boolean }).isComposing) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeFileNameDialog();
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        confirmFileNameDialog();
      }
    };
    window.addEventListener("keydown", onWindowKeyDown, true);
    return () => window.removeEventListener("keydown", onWindowKeyDown, true);
  }, [fileNameDialog, closeFileNameDialog, confirmFileNameDialog]);

  return {
    fileNameDialog,
    requestFileName,
    closeFileNameDialog,
    confirmFileNameDialog,
    onFileNameDialogValueChange,
    onFileNameDialogKeyDownCapture,
  };
};

