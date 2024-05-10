import { type LangObject, addTranslationsToGlobalWindowObject } from '../utils';

import jaDict from './dict.json';

const lang: LangObject = {
  language: 'ja',
  dictionary: jaDict,
};

addTranslationsToGlobalWindowObject(lang);

export default lang;
