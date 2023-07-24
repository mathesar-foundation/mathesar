import { get } from 'svelte/store';
import { LL } from './i18n-svelte';

export const getTranslator = () => get(LL);
