import { type LangObject, addTranslationsToGlobalWindowObject } from '../utils';

import esDict from './dict.json';

const lang: LangObject = {
  language: 'es',
  dictionary: esDict,
};

addTranslationsToGlobalWindowObject(lang);

export default lang;
