import { type LangObject, addTranslationsToGlobalWindowObject } from '../utils';

import enDict from './dict.json';

const lang: LangObject = {
  language: 'de',
  dictionary: deDict,
};

addTranslationsToGlobalWindowObject(lang);

export default lang;
