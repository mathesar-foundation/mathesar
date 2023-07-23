import { LL } from '@mathesar/i18n/i18n-svelte';
import { get } from 'svelte/store';

export const deleteSchemaConfirmationBody = [
  get(LL).databaseHelp.allObjectsInSchemaDeletedPermanently(),
  get(LL).general.areYouSureToProceed(),
];
