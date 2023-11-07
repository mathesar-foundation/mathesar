import ja from './ja.json';
import { type LangObject, addTranslationsToGlobalWindowObject } from '../utils';

const lang: LangObject = {
  language: 'ja',
  dictionary: ja,
};

addTranslationsToGlobalWindowObject(lang);

export default lang;
