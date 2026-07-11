import { type LangObject, addTranslationsToGlobalWindowObject } from '../utils';

import zhHansDict from './dict.json';

const lang: LangObject = {
  language: 'zh-hans',
  dictionary: zhHansDict,
};

addTranslationsToGlobalWindowObject(lang);

export default lang;
