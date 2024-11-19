import {
  faAlignLeft,
  faArrowLeft,
  faArrowRight,
  faArrowRightFromBracket,
  faBackspace,
  faCalendarDay,
  faCalendarWeek,
  faCaretRight,
  faCheck,
  faCheckSquare,
  faChevronRight,
  faCircleExclamation,
  faCircleInfo,
  faClock,
  faClone,
  faCogs,
  faCopy,
  faDatabase,
  faDiagramNext,
  faDollarSign,
  faEllipsisV,
  faEnvelope,
  faExternalLink,
  faExternalLinkAlt,
  faFileAlt,
  faFilter,
  faFilterCircleXmark,
  faGear,
  faGlobe,
  faGrip,
  faHammer,
  faHashtag,
  faICursor,
  faInfo,
  faKey,
  faLink,
  faListUl,
  faLock,
  faMicroscope,
  faPalette,
  faPaste,
  faPencilAlt,
  faPlug,
  faPlus,
  faProjectDiagram,
  faQuestion,
  faRedo,
  faSave,
  faSearchPlus,
  faShapes,
  faShareFromSquare,
  faSlash,
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
  faUndo,
  faUnlink,
  faUpRightFromSquare,
  faUpload,
  faUser,
  faUserEdit,
  faUserGear,
  faUserPlus,
  faUsers,
  faWandSparkles,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

import type { IconProps } from '@mathesar-component-library/types';

import {
  arrayIcon,
  connectDatabaseIcon,
  createDatabaseIcon,
  explorationIcon,
  outcomeIcon,
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

// THINGS
//
// (These names should all be nouns)

export const iconConnection: IconProps = { data: faPlug };
export const iconConstraint: IconProps = { data: faKey };
export const iconConstraintUnique: IconProps = { data: faSnowflake };
export const iconDatabase: IconProps = { data: faDatabase };
export const iconDbIdentifierDelimiter: IconProps = { data: faArrowRight };
export const iconDisplayOptions: IconProps = { data: faPalette };
export const iconExploration: IconProps = { data: explorationIcon };
export const iconExternalHyperlink: IconProps = { data: faUpRightFromSquare };
export const iconFiltering: IconProps = { data: faFilter };
export const iconGrouping: IconProps = { data: faListUl };
export const iconInwardLink: IconProps = { data: faArrowRight };
export const iconLinkToRecordPage: IconProps = { data: faExternalLinkAlt };
export const iconMultipleRecords: IconProps = { data: faCopy };
export const iconOutcome: IconProps = { data: outcomeIcon };
export const iconOutwardLink: IconProps = { data: faArrowLeft };
export const iconRecord: IconProps = { data: faFileAlt };
export const iconSchema: IconProps = { data: faProjectDiagram };
export const iconSettingsMajor: IconProps = { data: faGear };
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

// STATUSES

export const iconNotEditable: IconProps = { data: faLock };
export const iconUnsavedChanges: IconProps = { data: faCircleExclamation };
export const iconYes: IconProps = { data: faCheck };

// UI TYPES

export const iconUiTypeBoolean: IconProps = { data: faCheckSquare };
export const iconUiTypeDate: IconProps = { data: faCalendarDay };
export const iconUiTypeDateTime: IconProps = { data: faCalendarWeek };
export const iconUiTypeDuration: IconProps = { data: faStopwatch };
export const iconUiTypeEmail: IconProps = { data: faEnvelope };
export const iconUiTypeJsonArray: IconProps = { data: faClone };
export const iconUiTypeJsonObject: IconProps = { data: faShapes };
export const iconUiTypeMoney: IconProps = { data: faDollarSign };
export const iconUiTypeNumber: IconProps = { data: faHashtag };
export const iconUiTypeText: IconProps = { data: faAlignLeft };
export const iconUiTypeTime: IconProps = { data: faClock };
export const iconUiTypeUnknown: IconProps = { data: faQuestion };
export const iconUiTypeUri: IconProps = { data: faGlobe };
export const iconUiTypeArray: IconProps = { data: arrayIcon };
