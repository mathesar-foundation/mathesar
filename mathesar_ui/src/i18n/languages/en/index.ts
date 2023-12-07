import enDict from './dict.json';
import { type LangObject, addTranslationsToGlobalWindowObject } from '../utils';

const lang: LangObject = {
  language: 'en',
  dictionary: enDict,
};

addTranslationsToGlobalWindowObject(lang);

export default lang;
