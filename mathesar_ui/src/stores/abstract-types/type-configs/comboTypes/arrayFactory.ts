import { iconUiTypeArray } from '@mathesar/icons';
import type { ArrayTypeOptions } from '@mathesar/api/types/tables/columns';
import type { AbstractTypeConfigurationFactory } from '../../types';
import { getAbstractTypeForDbType } from '../../utils';

const arrayFactory: AbstractTypeConfigurationFactory = (map) => ({
  getIcon: (args) => {
    const arrayIcon = { ...iconUiTypeArray, label: 'Array' };
    if (args && args.typeOptions) {
      const typeOpts = args.typeOptions as ArrayTypeOptions;
      const innerAbstractType = getAbstractTypeForDbType(
        typeOpts.item_type,
        map,
      );
      if (innerAbstractType) {
        const innerIcon = innerAbstractType.getIcon();
        const innerIcons = Array.isArray(innerIcon) ? innerIcon : [innerIcon];
        return [{ ...iconUiTypeArray, label: 'Array' }, ...innerIcons];
      }
    }
    return arrayIcon;
  },
  cellInfo: {
    type: 'array',
  },
});

export default arrayFactory;
