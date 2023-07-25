import type { BaseTranslation } from '../i18n-types';

const en: BaseTranslation = {
  routes: {
    noDatabasesFound: 'No databases found',
    wrongWebPage: 'This is the not the webpage you are looking for.',
    explorationNotFound: 'Exploration not found.',
    databaseWithNameNotFound:
      'Database with name <>databaseName<> is not found.',
    urlNotFound: 'The specified URL is not found.',
    tableWithIdNotFound: 'Table with id {id: number} not found.',
    schemaNotFound: 'Schema not found.',
  },
  // TODO: Check for casing and formatters
  general: {
    administration: 'Administration',
    softwareUpdate: 'Software Update',
    edit: 'Edit',
    dataExplorer: 'Data Explorer',
    import: 'Import',
    userProfile: 'User Profile',
    users: 'Users',
    releaseNotes: 'Release Notes',
    documentation: 'documentation',
    continue: 'Continue',
    retry: 'Retry',
    upgrading: 'Upgrading',
    upgrade: 'Upgrade',
    released: 'Released',
    update: 'Update',
    error: 'Error',
    areYouSureToProceed: 'Are you sure you want to proceed?',
    save: 'Save',
    nameCannotBeEmpty: 'Name cannot be empty.',
    manageAccess: 'Manage Access',
    schemas: 'Schemas',
    createSchema: 'Create Schema',
    searchSchemaS: 'Search Schemas',
    rows: 'rows',
    variable: 'variable',
    editSchema: 'Edit Schema',
    deleteSchema: 'Delete Schema',
    inspector: 'Inspector',
    tableName: 'Table Name',
    tablePreview: 'Table Preview',
    cancel: 'Cancel',
    dataMustBeTabular:
      'The data must be in tabular format (CSV, TSV etc) or JSON. See relevant <>documentationLink<>.',
    fieldOptions: 'Field Options',
    setTo: 'Set to',
    discardChanges: 'Discard Changes',
    unknownColumn: 'unknown column',
    openDataExplorer: 'Open Data Explorer',
    newTable: 'New Table',
    fromScratch: 'From Scratch',
    editTableWithName: 'Edit <>tableName<> Table',
    noExplorations: 'No Explorations',
    loading: 'Loading',
    overview: 'Overview',
    tables: 'Tables',
    explorations: 'Explorations',
    searchTables: 'Search Tables',
    exploreTable: 'Explore Table',
    editTable: 'Edit Table',
    deleteTable: 'Delete Table',
    findARecord: 'Find a Record',
    noTables: 'No Tables',
    deleteAccount: 'Delete Account',
    accountDetails: 'Account Details',
    goToHomepage: 'Go to homepage',
    from: 'from',
    properties: 'Properties',
    actions: 'Actions',
    content: 'Content',
    name: 'Name',
    deleteExploration: 'Delete Exploration',
    description: 'Description',
    via: 'Via',
    notAggregated: 'Not Aggregated',
    summarize: 'Summarize',
    hideColumns: 'Hide Columns',
    filter: 'Filter',
    sort: 'Sort',
    editInDataExplorer: 'Edit in Data Explorer',
    result: 'Result',
    noResultsFound: 'No results found',
    saving: 'Saving',
    saveAndClose: 'Save and Close',
    undo: 'Undo',
    redo: 'Redo',
    saveExploration: 'Save Exploration',
    column: 'Column',
    cell: 'Cell',
    exploration: 'Exploration',
    pick: 'Pick',
    open: 'Open',
    record: 'Record',
    where: 'where',
    group: 'Group',
    primaryKeys: 'Primary Keys',
    foreignKeys: 'Foreign Keys',
    unique: 'Unique',
    add: 'Add',
    constraintName: 'Constraint Name',
    automatically: 'Automatically',
    manual: 'Manual',
    columns: 'Columns',
    setConstraintName: 'Set Constraint Name',
    constraints: 'Constraints',
    oneToMany: 'One to Many',
    manyToOne: 'Many to One',
    manyToMany: 'Many to Many',
    linkingTable: 'Linking Table',
    columnName: 'Column Name',
  },
  upgradeConfirm: {
    beforeUpgrading: 'Before Upgrading',
    readReleaseNotes:
      'Read the <>releaseNotesLink<> to see if this release requires any special upgrade instructions.',
    prepareForDowntime:
      'Prepare your users for up to five minutes of downtime.',
    whileUpgrading: 'While Upgrading',
    windowWillRemainOpen:
      'This window will remain open but all features within Mathesar will be unusable.',
    seeLoadingSpinner: 'You will see a loading spinner but no progress bar.',
    afterUpgrading: 'After Upgrading',
    automaticallyReload:
      'This page will automatically reload, showing the software update status again.',
    ifUpgradeSucceeds:
      "If the upgrade succeeds, you will see that you're running the latest version.",
    ifUpgradeFails:
      'If the upgrade fails, the update status screen will still show that an upgrade is available, and you will need to refer to our <>documentationLink<> for further troubleshooting.',
  },
  upgradeModal: {
    upgradeTo: 'Upgrade to {version: string}',
    upgradingTo: 'Upgrading to {version: string}',
    errorUpgrading: 'Error Upgrading',
  },
  upgradeProcessing: {
    upgradeInProgress:
      'A Mathesar upgrade is currently in progress. It is important that you do not navigate away from this page until the upgrade is complete.',
  },
  releaseBox: {
    newVersionAvailable: 'New Version Available',
    runningLatestVersion: 'You are running the latest version',
    currentlyInstalled: 'Currently Installed',
    latestAvailableVersion: 'Latest Available Version (not installed)',
    weCanInstallThisVersion: 'We can install this new version for you',
  },
  softwareUpdateContent: {
    loadingReleaseDate: 'Loading release data',
    errorInCurrentInstalled:
      'The currently-installed version is <>hash<> but we were unable to load data about this release.',
    errorInLatestRelease: 'Unable to load data about the latest release.',
    lastChecked: 'Last checked',
  },
  softwareUpdatePage: {
    releaseDataNotInContextError: 'Release data store not found in context.',
  },
  editUserPage: {
    userNotFound: 'User not found',
    editUser: 'Edit User',
    deleteUser: 'Delete User',
  },
  newUserPage: {
    newUser: 'New User',
  },
  usersListingPage: {
    addUser: 'Add user',
    noUsersFound: 'No users found',
    searchUsers: 'Search Users',
  },
  databaseHelp: {
    allObjectsInSchemaDeletedPermanently:
      'All objects in this schema will be deleted permanently, including (but not limited to) tables and views. Some of these objects may not be visible in the Mathesar UI.',
  },
  addEditSchemaModal: {
    schemaWithNameExists: 'A schema with that name already exists.',
    createNewSchema: 'Create New Schema',
    schemaNameHelp:
      'Name your schema to reflect its purpose. For example, your personal financial schema may be called "Personal Finances" and your movie collection "Movies." Add a description to your schema to remember what it\'s for.',
    renameSchema: 'Rename <>identifier<> Schema',
  },
  databaseDetails: {
    syncExternalChanges: 'Sync External Changes',
    structuralChangesHelp:
      'If you make structural changes to the database outside Mathesar (e.g. using another tool to add a schema, table, or column), those changes will not be reflected in Mathesar until you manually sync them with this button.',
    dataChangesHelp:
      'External changes to data (e.g. adding or editing <>rows<>) will be automatically reflected without clicking this button.',
  },
  databaseNavigationList: {
    allDatabases: 'All Databases',
    addOrRemoveDbHelp:
      'To add or remove databases, modify the <>variableNameAndLink<> in your configuration file and restart Mathesar.',
  },
  dbAccessControlModal: {
    manageDbAccess: 'Manage <>databaseName<> Database Access',
  },
  schemaRow: {
    publicSchemaHelp:
      'Every PostgreSQL database includes the "public" schema. This protected schema can be read by anybody who accesses the database.',
  },
  importPreviewErrorInfo: {
    failedToLoadPreview: 'Failed to load preview',
    deleteImport: 'Delete Import',
  },
  importPreviewPage: {
    errorInLoadingPreview: 'An error occurrent while loading the preview',
    unableToLoadPreview: 'Unable to load preview',
    dataTypeChangeFailed: 'Data Type Change Failed',
    unableToCancelImport: 'Unable to cancel import',
    unableToSaveTable: 'Unable to save table',
    finishSettingYourTable: 'Finish  setting up your table',
    tableConfirmed:
      'Table has already been confirmed. Click here to view the table.',
    columnNameAndDataTypes: 'Column names and data types',
    columnNameAndDataTypesAutoDetected:
      'Column names and data types are automatically detected, use the controls in the preview table to review and update them if necessary.',
    pleaseWaitForPreview: 'Please wait while we prepare a preview for you',
    previewOnlyForFirstFewRows:
      'Preview data is shown for the first few rows of your data only.',
    confirmAndCreateTable: 'Confirm & create table',
    useFirstRowAsHeader: 'Use first row as header',
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
  uploadViaClipboard: {
    pasteDataToUpload: 'Paste the data you want to import',
  },
  uploadViaUrl: {
    enterUrlOfFileToImport: 'Enter the URL of the file you want to import',
  },
  recordPageContent: {
    recordInTable: 'Record in <>tableName<>',
  },
  recordWidgets: {
    relatedRecord: 'Related Records',
    relatedRecordHelp:
      'Each of the following records link to <>recordSummary<> from another table.',
  },
  createNewExplorationTutorial: {
    createFirstExploration:
      "It's time to use your tables. Create your first exploration.",
    createFirstExplorationHelp:
      'Explorations let you query your data to uncover trends and insights. They may be stored and run anytime to see the latest data. Explorations make great reports. You might, for example, create an exploration that shows your monthly spending.',
  },
  createNewTableButton: {
    fromDataImport: 'From Data Import',
  },
  createNewTableTutorial: {
    createFirstTable: "You've created a new schema, now add tables to it.",
    createFirstTableHelp: '',
    howYouWantToCreateTable: 'How do you want to create your table?',
    importFromAFile: 'Import from a File',
  },
  schemaAccessControlModal: {
    manageSchemaAccessWithName: 'Manage <>schemaName<> Schema Access',
  },
  schemaExplorations: {
    searchExplorations: 'Search Explorations',
  },
  schemaOverview: {
    explorationsIntro:
      'Explorations let you query your data to uncover trends and insights.',
  },
  tableCard: {
    needImportConfirmation: 'Needs Import Confirmation',
  },
  profilePage: {
    contactAdminForPermanentDeletion:
      'Please contact your administrator to request permanent deletion of your account.',
    couldNoFetchProfile:
      'Could not fetch user profile details. Try refreshing your page.',
  },
  columnSource: {
    aggregatedFrom: 'Aggregated from',
    sourceColumn: 'Source Column',
  },
  columnTab: {
    moreThanOneColumnSelected: '{count: number} columns selected',
    selectAColumnToViewProperties: 'Select a column to view its properties',
  },
  deleteColumnAction: {
    cannotDeleteColumnLastRemainingBaseColumn:
      'This column cannot be deleted because atleast one column from the base table is required. Please add another column from the base table before deleting this column.',
    cannotDeleteColumnUsedInTransformation:
      'This column cannot be deleted because it is either used in transformations or a result of transformations. Please remove the column from the transformations before deleting it.',
    cannotDeleteColumnsLastRemainingBaseColumn:
      'Some of the selected columns cannot be deleted because atleast one column from the base table is required. Please add another column from the base table before deleting them.',
    cannotDeleteColumnsUsedInTransformation:
      "Some of the selected columns cannot be deleted because they're either used in transformations or results of transformations. Please remove them from the transformations before deleting them.",
  },
  cellTab: {
    selectACellToViewProperties: "Select a cell to view it's properties.",
  },
  explorationTab: {
    unableToSaveExploration: 'Unable to save Exploration.',
  },
  columnSelectionPane: {
    fromBaseTable: 'From Base table',
    fromLinkedTables: 'From linked tables',
    atLeastOneColumnFromBaseRequired:
      'At least one column from the the base table is required to add columns from linked tables.',
    linkedFromBaseTable: 'Linked from Base table',
    linkedToBaseTable: 'Linked to Base table',
  },
  selectableColum: {
    columnAddedTimes: 'This column has been added {times: string}',
  },
  hideTransformation: {
    selectColumnsToHide: 'Select Columns to Hide',
  },
  transformationPane: {
    addTransformationStep: 'Add transformation step',
  },
  inputSidebar: {
    selectColumns: 'Select Columns',
    transformResults: 'Transform Results',
    autoSummarizationConfirmBodyLine1:
      "By default, Mathesar shows only one related record per row when adding a column with multiple related records. We recommend adding a summarization step if you'd like to see related records as a list instead.",
    autoSummarizationConfirmBodyLine2:
      'You can manually configure a summarization later via the "Transform Results" pane.',
    summarizeAsAList: 'Yes, summarize as a list',
    continueWithoutSummarizing: 'No, continue without summarizing',
    buildYourExploration: 'Build your Exploration',
    columnSelectionHelpText:
      "Select the columns that will be used for the exploration. Columns are limited to those from the base table and it's linked tables.",
    transformResultsHelpText:
      'Transformations can be used to summarize data, filter data, and more. Note that transformations are applied in the order they are listed.',
    failedToFetchColumnInfo: 'Failed to fetch column information',
  },
  queryRunErrors: {
    resultCouldNotBeDisplayed: 'The result could not be displayed.',
    someColumnsInQueryAreMissing:
      'Some of the columns present in the query are missing in teh underlying base table.',
    attemptToRecoverTheQuery:
      'You can attempt to recover the query by clicking on the button below.',
    thisWillRemoveTheColumns: 'This will remove the following column(s)',
    thisWillRemoveTheTransformations:
      'This will remove the following transformation(s)',
    attemptExplorationRecovery: 'Attempt Exploration recovery',
    editExplorationToRecover:
      'You can edit the exploration the Data Explorer to attempt recovering it.',
  },
  dataExplorerResults: {
    noColumnsInExploration:
      'This exploration does not contain any columns. Edit the exploration to add columns to it.',
    showingPageStartToEndOfTotal:
      'Showing {pageStart: number}-{pageEnd: number} of {total: number}',
  },
  dataExplorerActionsPane: {
    explorationWithNameExists: 'An exploration with that name already exists.',
    basedOn: 'Based on',
    exploringFrom: 'Exploring from',
    baseTableHelp:
      'The base table is the table that is being explored and determines the column that are available form exploration.',
    // TODO: better naming needed.
    baseTableColumnsHelp:
      'The base table determines the columns that are available for exploration',
    startOver: 'Start Over',
  },
  dataExplorer: {
    createAndShareExplorations: 'Create and Share Explorations of Your Data',
    createAndShareExplorationsBody:
      'Use Data Explorer to analyze and share your data. Explorations are based on tables in your schema, to get started choose a table and start adding columns and transformations.',
    getStartBySelectingTable:
      'Get started by selecting a table and adding columns',
    getStartedByAddingColumns: 'Get started by adding columns from the left',
  },
  queryManager: {
    errorFetchingJoinableLinks: 'There was an error fetching joinable links',
    errorSavingQuery: 'An error occurred while trying to save teh query',
  },
  queryModel: {
    onlySingleSummarizationAllowed:
      'QueryModel currently allows only a single summarization transformation',
    cannotRunBaseTableUndefined:
      'Cannot formulate run request since base_table is undefined',
  },
  queryRunner: {
    unableToRunQuery: 'Unable to run query due to an unknown reason',
  },
  dataExplorerUtils: {
    multipleLinksPresentForSameColumn:
      'Multiple links present for the same column: {columnId: number}',
  },
  recordSelectorContent: {
    noRecordSummaryInAPI: 'No record summary template found in API response.',
    createRecordFromSearch: 'Create Record From Search Criteria',
    best10MatchesShown:
      'The 10 best matches are shown. Continue filtering to see more.',
    first10RecordsShown: 'The first 10 records are shown. Filter to see more.',
    noMatchingRecords: 'No matching records',
    noExistingRecords: 'No existing records',
  },
  recordOperationsFilters: {
    filterRecords: 'Filter records',
    noFiltersHaveBeenAdded: 'No filters have been added',
    addNewFilter: 'Add New Filter',
  },
  recordOperationsGroup: {
    groupRecordsBy: 'Group records by',
    noGroupingAdded: 'No grouping condition has been added',
    addNewGrouping: 'Add New Grouping',
  },
  recordOperationsSort: {
    noSortingAdded: 'No sorting condition has been added',
    addNewSortCondition: 'Add new sort condition',
  },
  constraintHelp: {
    constraintDescription:
      'Constraints help you keep your data clean by rejecting invalid data before it gets entered.',
  },
  constraintsConstraintNameHelp: {
    constraintNameDb:
      'At the database level, each constraint must have a unique name across all the constraints, tables, views, and indexes within the schema.',
    constraintNameMathesar:
      'In Mathesar however, the name of the constraint will likely never be relevant, &mdash; so we recommend allowing Mathesar to automatically generate constraint names when adding new constraints.',
  },
  constraintNameHelp: {
    primaryKeyHelp:
      'A primary key constraint uniquely identifies each record in a table.',
    foreignKeyHelp: 'A foreign key constraint links records in two tables.',
    uniqueConstraintHelp:
      'A unique constraint ensures that each record in a column is unique.',
    noConstraints: 'No {constraintType: string} Constraints',
  },
  newForeignKeyConstraint: {
    newForeignKeyConstraint: 'New Foreign Key Constraint',
    columnReferencesTargetTable:
      'Column in this table which references the target table',
    targetTable: 'Target Table',
    targetColumnInTable: 'Target Column in <>tableName<> Table',
  },
  newUniqueConstraint: {
    constraintWithNameExists: 'A constraint with that name already exists',
    unableToAddConstraint: 'Unable to add constraint.',
    newUniqueConstraint: 'New Unique Constraint',
  },
  tableConstraints: {
    unableToFetchTableConstraints: 'Unable to fetch table constraints',
    noConstraints: 'No constraints',
  },
  tableConstraintsModal: {
    constraintsDescription:
      'Constraints are used to define relationships between records in different tables or to ensure that records in a column are unique. Constraints can be applied to a single column or a combination of columns.',
  },
  columnHEaderContextMenu: {
    addFilter: 'Add Filter',
    filterColumn: 'Filter Column',
    removeSorting: 'Remove {sortingType: string} Sorting',
    removeGrouping: 'Remove Grouping',
    groupByColumn: 'Group by Column',
  },
  newColumnCell: {
    newColumn: 'New Column',
    selectType: 'Select Type',
  },
  linkTableForm: {
    twoColumnsCannotHaveSameName: 'The two columns cannot have the same name.',
    linkCreatedSuccessfully: 'The link has been created successfully',
    linksInfo:
      'Links are stored in the database as foreign key constraints, which you may add to existing columns via the "Advanced" section of the table inspector.',
    linkTo: 'Link <>baseTable<> to',
    weWillCreateANewTable: "We'll create a new table.",
    add2ColumnsLinkingToTarget:
      "We'll add two columns in <>mappingTable<> each linking to <>targetTable<>.",
    indexedColumnName: 'Column {index: number} Name',
    createLink: 'Create Link',
  },
  linkTableUtils: {
    ifColumnNameIsId:
      'The name "id" is reserved for the primary key column that will be created when creating the table.',
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
  newColumn: {
    newColumnInBaseLinkingToTarget:
      "We'll add a column in <>baseTable<> which links to <>targetTable<>",
  },
  selectLinkType: {
    typeOfLinkTo: 'Type of link to <>targetTable<>',
  },
};

export default en;
