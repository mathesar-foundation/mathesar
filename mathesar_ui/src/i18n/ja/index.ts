import en from '../en/index';
import type { Translation } from '../i18n-types';
import {
  addTranslationsToGlobalObject,
  extendDictionary,
} from '../i18n-util.js';

const ja = extendDictionary(en, {}) as Translation;

export default ja;

addTranslationsToGlobalObject('en', ja);
