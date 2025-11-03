import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import { iconSelectMultipleCells } from '@mathesar/icons';
import { deviceInfo } from '@mathesar/packages/svelte-device-info';
import { buttonMenuEntry } from '@mathesar-component-library';

export function* selectCellRange(p: { beginSelectingCellRange: () => void }) {
  const hasPhysicalKeyboard = get(deviceInfo.hasPhysicalKeyboard);
  const hasTouchCapability = get(deviceInfo.hasTouchCapability);
  if (hasTouchCapability || !hasPhysicalKeyboard) {
    yield buttonMenuEntry({
      icon: iconSelectMultipleCells,
      label: get(_)('select_cell_range'),
      onClick: p.beginSelectingCellRange,
    });
  }
}
