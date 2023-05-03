import {
  type Countable,
  pluralizeThisPronoun,
  pluralize,
} from '@mathesar/utils/languageUtils';

export const getRecordDeleteMessage = (countable: Countable) =>
  `Deleting ${pluralizeThisPronoun(countable)} ${pluralize(
    countable,
    'records',
  )} will remove the entire ${pluralize(
    countable,
    'rows',
  )}. Are you sure you want to proceed?`;
