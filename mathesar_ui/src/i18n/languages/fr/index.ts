import { type LangObject, addTranslationsToGlobalWindowObject } from '../utils';

import frDict from './dict.json';

const lang: LangObject = {
  language: 'fr',
  dictionary: frDict,
};

addTranslationsToGlobalWindowObject(lang);

export default lang;
