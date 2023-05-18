import { type Countable, pluralize } from '@mathesar/utils/languageUtils';

export const getRecordDeleteMessage = (countable: Countable) =>
  `Once deleted, the ${pluralize(
    countable,
    'records',
  )} cannot be recovered. Are you sure you want to proceed?`;
