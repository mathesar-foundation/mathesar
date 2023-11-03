import type { BaseTranslation, Translations } from '../i18n-types';
import { addTranslationsToGlobalObject } from '../i18n-util';

const en: BaseTranslation = {
  general: {
    dataSource: 'Data Source',
    import: 'Import',
    linkingTable: 'Linking Table',
    manyToMany: 'Many to Many',
    manyToOne: 'Many to One',
    noFileUploaded: 'No file uploaded',
    oneToMany: 'One to Many',
    processingData: 'Processing Data',
  },
  importUploadPage: {
    uploadAFile: 'Upload a file',
    provideUrlToFile: 'Provide a URL to the file',
    copyAndPasteText: 'Copy and Paste Text',
    createATableByImporting: 'Create a table by importing your data',
    largeDataTakesTimeWarning:
      'Large data sets can sometimes take several minutes to process. Please do not leave this page or close the browser tab while the import is in progress.',
  },
  linkTypeOptions: {
    oneToManyDescription:
      'One [baseTable] record can be linked from multiple [targetTable] records.',
    manyToOneDescription:
      'Multiple [baseTable] records can link to the same [targetTable] record.',
    manyToManyDescription:
      'Multiple [baseTable] and [targetTable] records can link to each other through a new [mappingTable]',
    manyToManySelfReferential:
      'Multiple [baseTable] records can link to each other through a new [mapping]',
  },
};

export default en;

addTranslationsToGlobalObject('en', en as Translations);
