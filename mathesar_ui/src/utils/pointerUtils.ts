type ModifierKeyCombo =
  | ''
  // 1 modifier
  | 'Alt'
  | 'Ctrl'
  | 'Meta'
  | 'Shift'
  // 2 modifiers
  | 'Alt+Ctrl'
  | 'Alt+Meta'
  | 'Alt+Shift'
  | 'Ctrl+Meta'
  | 'Ctrl+Shift'
  | 'Meta+Shift'
  // 3 modifiers
  | 'Alt+Ctrl+Meta'
  | 'Alt+Ctrl+Shift'
  | 'Alt+Meta+Shift'
  | 'Ctrl+Meta+Shift'
  // 4 modifiers
  | 'Alt+Ctrl+Meta+Shift';

export function getModifierKeyCombo(e: MouseEvent) {
  return [
    ...(e.altKey ? ['Alt'] : []),
    ...(e.ctrlKey ? ['Ctrl'] : []),
    ...(e.metaKey ? ['Meta'] : []),
    ...(e.shiftKey ? ['Shift'] : []),
  ].join('+') as ModifierKeyCombo;
}
