import type { InputAction, KeyBinding } from './types';

/**
 * Compute updated bindings by assigning `code` to `action`.
 * Ensures global uniqueness of codes by removing any existing entry using `code`.
 * Replaces the first binding for the target action if present; otherwise adds a new one.
 */
export function updateBindings(
  bindings: readonly KeyBinding[],
  action: InputAction,
  code: string,
): KeyBinding[] {
  const filtered = bindings.filter((b) => b.code !== code);
  const idx = filtered.findIndex((b) => b.action === action);
  if (idx >= 0) {
    const next = [...filtered];
    next[idx] = { ...next[idx], code };
    return next;
  }
  return [...filtered, { code, action }];
}

