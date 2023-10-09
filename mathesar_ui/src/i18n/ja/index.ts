import en from '../en/index.js';
import type { Translation } from '../i18n-types.js';
import {
  addTranslationsToGlobalObject,
  extendDictionary,
} from '../i18n-util.js';

const ja = extendDictionary(en, {}) as Translation;

export default ja;

addTranslationsToGlobalObject('en', ja);
