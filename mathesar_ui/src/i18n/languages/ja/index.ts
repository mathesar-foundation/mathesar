import jaDict from './dict.json';
import { type LangObject, addTranslationsToGlobalWindowObject } from '../utils';

const lang: LangObject = {
  language: 'ja',
  dictionary: jaDict,
};

addTranslationsToGlobalWindowObject(lang);

export default lang;
