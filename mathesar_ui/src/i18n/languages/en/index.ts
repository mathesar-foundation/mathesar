import en from './en.json';
import { type LangObject, addTranslationsToGlobalWindowObject } from '../utils';

const lang: LangObject = {
  language: 'en',
  dictionary: en,
};

addTranslationsToGlobalWindowObject(lang);

export default lang;
