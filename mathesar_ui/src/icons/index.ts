import {
  faAlignLeft,
  faArrowLeft,
  faArrowRight,
  faArrowRightFromBracket,
  faBackspace,
  faBook,
  faCalendarDay,
  faCalendarWeek,
  faCaretRight,
  faCheck,
  faCheckSquare,
  faChevronRight,
  faCircleExclamation,
  faCircleInfo,
  faClipboardList,
  faClock,
  faClone,
  faCloudDownloadAlt,
  faCogs,
  faCommentAlt,
  faComments,
  faCopy,
  faDatabase,
  faDiagramNext,
  faDollarSign,
  faDownload,
  faEllipsisV,
  faEnvelope,
  faExternalLink,
  faExternalLinkAlt,
  faFile,
  faFileAlt,
  faFileArchive,
  faFileAudio,
  faFileCode,
  faFileCsv,
  faFileExcel,
  faFileImage,
  faFilePdf,
  faFilePowerpoint,
  faFileVideo,
  faFileWord,
  faFilter,
  faFilterCircleXmark,
  faFingerprint,
  faGear,
  faGlobe,
  faGrip,
  faHammer,
  faHandPointer,
  faHashtag,
  faHeart,
  faICursor,
  faInfo,
  faKey,
  faLink,
  faListUl,
  faLock,
  faMicroscope,
  faNewspaper,
  faPalette,
  faPaperPlane,
  faPaste,
  faPencilAlt,
  faPlay,
  faPlug,
  faPlus,
  faProjectDiagram,
  faQuestion,
  faRedo,
  faRotateBack,
  faSave,
  faSearchPlus,
  faShapes,
  faShareFromSquare,
  faSlash,
  faSliders,
  faSnowflake,
  faSort,
  faSortAmountDown,
  faSortAmountDownAlt,
  faStar,
  faStopwatch,
  faSync,
  faT,
  faTimes,
  faTrashAlt,
  faTriangleExclamation,
  faUndo,
  faUnlink,
  faUpRightFromSquare,
  faUpload,
  faUser,
  faUserEdit,
  faUserGear,
  faUserPlus,
  faUserSecret,
  faUsers,
  faWandSparkles,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

import type { IconProps } from '@mathesar-component-library/types';

import {
  arrayIcon,
  circleLowercaseIIcon,
  connectDatabaseIcon,
  createDatabaseIcon,
  databaseLineIcon,
  explorationIcon,
  jsonIcon,
  mathesarNameIcon,
  modalRecordViewIcon,
  outcomeIcon,
  permissionsIcon,
  tableIcon,
  treeChildNodeArrowIcon,
} from './customIcons';

/**
 * @file
 *
 * - This file contains the **Mathesar-specific** icon definitions. For generic
 *   icon definitions, see the file: `src/component-library/common/icons.ts`.
 *
 * - When placing icons in the UI, prefer using icon definitions from the
 *   component library when possible. For example, don't define `iconClose`
 *   within this file because it already exists within the component library
 *   icon definitions.
 */

// ACTIONS
//
// (These names should all be verbs)

export const iconAddFilter: IconProps = { data: faFilter };
export const iconAddNew: IconProps = { data: faPlus };
export const iconAddUser: IconProps = { data: faUserPlus };
export const iconChangeAToB = { data: faArrowRight };
export const iconConfigure: IconProps = { data: faCogs };
export const iconConnectDatabase = { data: connectDatabaseIcon };
export const iconCopyMajor: IconProps = { data: faCopy };
/** TODO: use faBinary once it's available (via newer FontAwesome version) */
export const iconCopyRawContent: IconProps = { data: faCopy };
export const iconCopyFormattedContent: IconProps = { data: faCopy };
export const iconCreateDatabase = { data: createDatabaseIcon };
/** When you're deleting something significant or difficult to recover */
export const iconDeleteMajor: IconProps = { data: faTrashAlt };
/** When you're deleting something smaller or more ephemeral */
export const iconDeleteMinor: IconProps = { data: faTimes };
export const iconEdit: IconProps = { data: faPencilAlt };
export const iconEditUser: IconProps = { data: faUserEdit };
export const iconExpandRight: IconProps = { data: faChevronRight };
export const iconExport: IconProps = { data: faDownload };
export const iconImportData: IconProps = { data: faUpload };
export const iconInferColumnType: IconProps = { data: faMicroscope };
export const iconMoreActions: IconProps = { data: faEllipsisV };
export const iconMoveColumnsToNewLinkedTable = { data: faLink };
export const iconMoveColumnsToExistingLinkedTable = { data: faLink };
export const iconManageAccess = { data: faUser };
export const iconNextStep = { data: faArrowRight };
/** Submit a selection with the record selector for data entry */
export const iconPickRecord: IconProps = { data: faCheck };
export const iconRedo: IconProps = { data: faRedo };
export const iconRefresh: IconProps = { data: faSync };
export const iconRemoveFilter: IconProps = { data: faFilterCircleXmark };
export const iconRename: IconProps = { data: faICursor };
export const iconSave: IconProps = { data: faSave };
/** Open the record selector */
export const iconSelectRecord: IconProps = { data: faSearchPlus };
export const iconSetToNull: IconProps = { data: faBackspace };
export const iconSend: IconProps = { data: faPaperPlane };
export const iconSortAscending: IconProps = { data: faSortAmountDownAlt };
export const iconSortDescending: IconProps = { data: faSortAmountDown };
export const iconUndo: IconProps = { data: faUndo };
export const iconUnlink: IconProps = { data: faUnlink };
export const iconPaste: IconProps = { data: faPaste };
export const iconLogout: IconProps = { data: faArrowRightFromBracket };
export const iconUseFirstRowAsColumnName: IconProps = { data: faDiagramNext };
export const iconUseFirstRowAsData: IconProps = { data: faWandSparkles };
export const iconShare: IconProps = { data: faShareFromSquare };
export const iconRecreate: IconProps = { data: faRedo };
export const iconDisable: IconProps = { data: faXmark };
export const iconOpenLinkInNewTab = { data: faExternalLink };
export const iconGrip = { data: faGrip };
export const iconReinstall = { data: faRotateBack };
export const iconAddPrimaryKeyColumn = iconAddNew;
export const iconPickPrimaryKeyColumn = { data: faHandPointer };
export const iconDuplicateRecord: IconProps = {
  data: faClone,
  flip: 'vertical',
};
export const iconFillOutForm: IconProps = { data: faPlay };
export const iconAddToFavorites: IconProps = { data: faPlus };
export const iconRemoveFromFavorites: IconProps = { data: faHeart };
export const iconDownload: IconProps = { data: faCloudDownloadAlt };

// THINGS
//
// (These names should all be nouns)

export const iconCommunityChat: IconProps = { data: faComments };
export const iconConnection: IconProps = { data: faPlug };
export const iconConstraint: IconProps = { data: faKey };
export const iconConstraintUnique: IconProps = { data: faSnowflake };
export const iconDatabase: IconProps = { data: databaseLineIcon };
export const iconDbIdentifierDelimiter: IconProps = { data: faArrowRight };
export const iconDisplayOptions: IconProps = { data: faPalette };
export const iconDocumentation: IconProps = { data: faBook };
export const iconDonation: IconProps = { data: faHeart };
export const iconClock: IconProps = { data: faClock };
export const iconExploration: IconProps = { data: explorationIcon };
export const iconExternalHyperlink: IconProps = { data: faUpRightFromSquare };
export const iconFeedback: IconProps = { data: faCommentAlt };
export const iconFiltering: IconProps = { data: faFilter };
export const iconForm: IconProps = { data: faClipboardList };
export const iconGrouping: IconProps = { data: faListUl };
export const iconInwardLink: IconProps = { data: faArrowRight };
export const iconLinkToRecordPage: IconProps = { data: faExternalLinkAlt };
export const iconMailingList: IconProps = { data: faNewspaper };
export const iconMessage: IconProps = { data: faEnvelope };
export const iconMultipleRecords: IconProps = { data: faCopy };
export const iconOutcome: IconProps = { data: outcomeIcon };
export const iconOutwardLink: IconProps = { data: faArrowLeft };
export const iconRecord: IconProps = { data: faFileAlt };
export const iconSchema: IconProps = { data: faProjectDiagram };
export const iconSettingsMajor: IconProps = { data: faGear };
export const iconSettingsMinor: IconProps = { data: faSliders };
export const iconShortcuts: IconProps = { data: faStar };
export const iconSorting: IconProps = { data: faSort };
export const iconTable: IconProps = { data: tableIcon };
export const iconInspector: IconProps = { data: faInfo };
export const iconTableLink: IconProps = { data: faLink };
export const iconTechnicalExplanation: IconProps = { data: faHammer };
export const iconTreeChildNodeArrow: IconProps = {
  data: treeChildNodeArrowIcon,
};
export const iconUpgradeAvailable: IconProps = { data: faCircleInfo };
export const iconCurrentlyInstalledVersion: IconProps = { data: faCheck };
export const iconUser: IconProps = { data: faUser };
export const iconMultipleUsers: IconProps = { data: faUsers };
export const iconAdminUser: IconProps = { data: faUserGear };
export const iconLinksInThisTable: IconProps = { data: faArrowRight };
export const iconLinksFromOtherTables: IconProps = { data: faArrowLeft };
export const iconForwardSeparator: IconProps = { data: faSlash };
export const iconUrl: IconProps = { data: faLink };
export const iconText: IconProps = { data: faT };
export const iconField: IconProps = { data: faDatabase };
export const iconFieldDelimiter: IconProps = { data: faCaretRight };
export const iconPermissions: IconProps = { data: permissionsIcon };
export const iconPrivacy: IconProps = { data: faUserSecret };
export const iconPrimaryKey: IconProps = { data: faKey };
export const iconAutomaticallyAdded: IconProps = { data: outcomeIcon };
export const iconDescription: IconProps = { data: circleLowercaseIIcon };
export const iconMathesarName: IconProps = { data: mathesarNameIcon };
export const iconModalRecordView: IconProps = { data: modalRecordViewIcon };

export const iconFile: IconProps = { data: faFile };
export const iconFileAlt: IconProps = { data: faFileAlt };
export const iconFileArchive: IconProps = { data: faFileArchive };
export const iconFileAudio: IconProps = { data: faFileAudio };
export const iconFileCode: IconProps = { data: faFileCode };
export const iconFileCSV: IconProps = { data: faFileCsv };
export const iconFileExcel: IconProps = { data: faFileExcel };
export const iconFileImage: IconProps = { data: faFileImage };
export const iconFilePDF: IconProps = { data: faFilePdf };
export const iconFilePowerpoint: IconProps = { data: faFilePowerpoint };
export const iconFileVideo: IconProps = { data: faFileVideo };
export const iconFileWord: IconProps = { data: faFileWord };

// STATUSES

export const iconNotEditable: IconProps = { data: faLock };
export const iconUnsavedChanges: IconProps = { data: faCircleExclamation };
export const iconYes: IconProps = { data: faCheck };
export const iconRequiresUpgrade: IconProps = { data: faTriangleExclamation };
export const iconRequiresAttention: IconProps = { data: faCircleExclamation };
export const iconPubliclyShared: IconProps = { data: faGlobe };

// UI TYPES

export const iconUiTypeBoolean: IconProps = { data: faCheckSquare };
export const iconUiTypeDate: IconProps = { data: faCalendarDay };
export const iconUiTypeDateTime: IconProps = { data: faCalendarWeek };
export const iconUiTypeDuration: IconProps = { data: faStopwatch };
export const iconUiTypeEmail: IconProps = { data: faEnvelope };
export const iconUiTypeJson: IconProps = { data: jsonIcon };
export const iconUiTypeJsonArray: IconProps = { data: faClone };
export const iconUiTypeJsonObject: IconProps = { data: faShapes };
export const iconUiTypeMoney: IconProps = { data: faDollarSign };
export const iconUiTypeNumber: IconProps = { data: faHashtag };
export const iconUiTypeText: IconProps = { data: faAlignLeft };
export const iconUiTypeTime: IconProps = { data: faClock };
export const iconUiTypeUnknown: IconProps = { data: faQuestion };
export const iconUiTypeUri: IconProps = { data: faGlobe };
export const iconUiTypeArray: IconProps = { data: arrayIcon };
export const iconUiTypeUuid: IconProps = { data: faFingerprint };
