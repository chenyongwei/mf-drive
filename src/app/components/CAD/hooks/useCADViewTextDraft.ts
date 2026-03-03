import { useEffect, useMemo } from "react";
import type { RefObject } from "react";
import type { CADToolType } from "../CADToolPanel";
import type { Viewport } from "../types/CADCanvasTypes";
import type { TextDraftState } from "./useCADDrawing.types";

interface UseCADViewTextDraftOptions {
  activeTool: CADToolType;
  textDraft: TextDraftState | null;
  textEditorRef: RefObject<HTMLTextAreaElement | null>;
  viewport: Viewport;
}

export function useCADViewTextDraft({
  activeTool,
  textDraft,
  textEditorRef,
  viewport,
}: UseCADViewTextDraftOptions) {
  useEffect(() => {
    if (activeTool !== "draw-text" || !textDraft) {
      return;
    }

    const focusTextEditor = () => {
      const editor = textEditorRef.current;
      if (!editor) {
        return;
      }

      editor.focus({ preventScroll: true });
      const caret = editor.value.length;
      editor.setSelectionRange(caret, caret);
    };

    const rafId = window.requestAnimationFrame(() => {
      focusTextEditor();
      window.setTimeout(focusTextEditor, 0);
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [activeTool, textDraft?.position.x, textDraft?.position.y, textEditorRef]);

  const textInputScreenPoint = useMemo(() => {
    if (!textDraft) {
      return null;
    }

    return {
      x: textDraft.position.x * viewport.zoom + viewport.pan.x,
      y: textDraft.position.y * viewport.zoom + viewport.pan.y,
    };
  }, [textDraft, viewport]);

  return {
    textInputScreenPoint,
  };
}
