import type { BaseTranslation } from '../i18n-types.js';

const en: BaseTranslation = {
  general: {
    import: 'Import',
    oneToMany: 'One to Many',
    manyToOne: 'Many to One',
    manyToMany: 'Many to Many',
    linkingTable: 'Linking Table',
  },
  importUploadPage: {
    uploadAFile: 'Upload a file',
    provideUrlToFile: 'Provide a URL to the file',
    copyAndPasteText: 'Copy and Paste Text',
    unableToCreateTableFromUpload:
      'Unable to create a table from the uploaded data',
    createATableByImporting: 'Create a table by importing your data',
    uploadingData: 'Uploading Data',
    largeDataTakesTimeWarning:
      'Large data sets can sometimes take several minutes to process. Please do not leave this page or close the browser tab while import is in progress.',
    howWouldYouLikeToImport: 'How would you like to import your data?',
    uploadFailed: 'Upload failed',
    preparingPreview: 'Preparing Preview',
    failedToImport: 'Failed to import data',
  },
  linkTypeOptions: {
    oneToManyDescription:
      'One <>baseTable<> record can be linked from multiple <>targetTable<> records.',
    manyToOneDescription:
      'Multiple <>baseTable<> records can link to the same <>targetTable<> record.',
    manyToManyDescription:
      'Multiple <>baseTable<> and <>targetTable<> records can link to each other through a new <>mappingTable<>',
    manyToManySelfReferential:
      'Multiple <>baseTable<> records can link to each other through a new <>mapping<>',
  },
};

export default en;
