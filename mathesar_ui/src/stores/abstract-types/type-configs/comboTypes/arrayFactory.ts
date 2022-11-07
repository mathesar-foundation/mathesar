import { iconUiTypeArray } from '@mathesar/icons';
import type { ArrayTypeOptions } from '@mathesar/api/tables/columns';
import type {
  AbstractTypeCategoryIdentifier,
  AbstractTypeConfigurationFactory,
} from '../../types';

const arrayFactory: AbstractTypeConfigurationFactory = (map) => ({
  getIcon: (args) => {
    const arrayIcon = { ...iconUiTypeArray, label: 'Array' };
    if (args && args.typeOptions) {
      const typeOpts = args.typeOptions as ArrayTypeOptions;
      const innerAbstractType =
        map[typeOpts.item_type as AbstractTypeCategoryIdentifier];
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
