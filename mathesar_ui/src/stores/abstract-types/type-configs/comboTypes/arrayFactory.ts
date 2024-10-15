import { iconUiTypeArray } from '@mathesar/icons';

import type { AbstractTypeConfigurationFactory } from '../../types';
import { getAbstractTypeForDbType } from '../../utils';

const arrayFactory: AbstractTypeConfigurationFactory = (map) => ({
  getIcon: (args) => {
    const arrayIcon = { ...iconUiTypeArray, label: 'Array' };
    const itemType = args?.typeOptions?.item_type ?? undefined;
    if (!itemType) return arrayIcon;
    const innerAbstractType = getAbstractTypeForDbType(itemType, map);
    const innerIcon = innerAbstractType.getIcon();
    const innerIcons = Array.isArray(innerIcon) ? innerIcon : [innerIcon];
    return [arrayIcon, ...innerIcons];
  },
  cellInfo: {
    type: 'array',
  },
});

export default arrayFactory;
