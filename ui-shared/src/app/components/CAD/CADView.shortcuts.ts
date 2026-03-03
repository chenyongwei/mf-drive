export function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!target) {
    return false;
  }

  const element = target instanceof Element ? target : null;
  if (!element) {
    return false;
  }

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  ) {
    return true;
  }

  if (element instanceof HTMLElement && element.isContentEditable) {
    return true;
  }

  const editableAncestor = element.closest(
    "input, textarea, select, [contenteditable='true'], [contenteditable=''], [role='textbox']",
  );
  return Boolean(editableAncestor);
}

export function shouldIgnoreCadShortcut(event: KeyboardEvent): boolean {
  if ((event as KeyboardEvent & { isComposing?: boolean }).isComposing) {
    return true;
  }

  if (isEditableKeyboardTarget(event.target)) {
    return true;
  }

  return isEditableKeyboardTarget(document.activeElement);
}
