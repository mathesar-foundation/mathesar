import { type LangObject, addTranslationsToGlobalWindowObject } from '../utils';

import enDict from './dict.json';

const lang: LangObject = {
  language: 'en',
  dictionary: enDict,
};

addTranslationsToGlobalWindowObject(lang);

export default lang;
