import {
  faAlignLeft,
  faArrowLeft,
  faArrowRight,
  faBackspace,
  faCalendarDay,
  faCalendarWeek,
  faCheck,
  faCheckSquare,
  faChevronRight,
  faClock,
  faClone,
  faCogs,
  faCopy,
  faDatabase,
  faDollarSign,
  faEnvelope,
  faExternalLinkAlt,
  faFileAlt,
  faFilter,
  faGlobe,
  faHammer,
  faHashtag,
  faICursor,
  faKey,
  faLink,
  faLock,
  faPalette,
  faPencilAlt,
  faPlus,
  faProjectDiagram,
  faQuestion,
  faRedo,
  faSearchPlus,
  faShapes,
  faSnowflake,
  faSort,
  faSortAmountDown,
  faSortAmountDownAlt,
  faStopwatch,
  faSync,
  faTrashAlt,
  faUndo,
  faUnlink,
  faUpload,
  faUser,
  faSave,
  faTimes,
  faCircleExclamation,
  faCircleArrowRight,
  faCircleArrowLeft,
  faListUl,
  faInfo,
  faSlash,
  faStar,
  faPaste,
} from '@fortawesome/free-solid-svg-icons';
import type { IconProps } from '@mathesar-component-library/types';
import {
  arrayIcon,
  tableIcon,
  explorationIcon,
  outcomeIcon,
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

export const iconAddNew: IconProps = { data: faPlus };
export const iconConfigure: IconProps = { data: faCogs };
/** When you're deleting something significant or difficult to recover */
export const iconDeleteMajor: IconProps = { data: faTrashAlt };
/** When you're deleting something smaller or more ephemeral */
export const iconDeleteMinor: IconProps = { data: faTimes };
export const iconEdit: IconProps = { data: faPencilAlt };
export const iconExpandRight: IconProps = { data: faChevronRight };
export const iconImportData: IconProps = { data: faUpload };
export const iconMoveColumnsToNewLinkedTable = { data: faLink };
export const iconMoveColumnsToExistingLinkedTable = { data: faLink };
/** Submit a selection with the record selector for data entry */
export const iconPickRecord: IconProps = { data: faCheck };
export const iconRedo: IconProps = { data: faRedo };
export const iconRefresh: IconProps = { data: faSync };
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

// THINGS
//
// (These names should all be nouns)

export const iconConstraint: IconProps = { data: faKey };
export const iconConstraintUnique: IconProps = { data: faSnowflake };
export const iconDatabase: IconProps = { data: faDatabase };
export const iconDbIdentifierDelimiter: IconProps = { data: faArrowRight };
export const iconDisplayOptions: IconProps = { data: faPalette };
export const iconExploration: IconProps = { data: explorationIcon };
export const iconFiltering: IconProps = { data: faFilter };
export const iconGrouping: IconProps = { data: faListUl };
export const iconInwardLink: IconProps = { data: faArrowRight };
export const iconLinkToRecordPage: IconProps = { data: faExternalLinkAlt };
export const iconMultipleRecords: IconProps = { data: faCopy };
export const iconOutcome: IconProps = { data: outcomeIcon };
export const iconOutwardLink: IconProps = { data: faArrowLeft };
export const iconRecord: IconProps = { data: faFileAlt };
export const iconSchema: IconProps = { data: faProjectDiagram };
export const iconShortcuts: IconProps = { data: faStar };
export const iconSorting: IconProps = { data: faSort };
export const iconTable: IconProps = { data: tableIcon };
export const iconInspector: IconProps = { data: faInfo };
export const iconTableLink: IconProps = { data: faLink };
export const iconTechnicalExplanation: IconProps = { data: faHammer };
export const iconUser: IconProps = { data: faUser };
export const iconLinksInThisTable: IconProps = { data: faCircleArrowRight };
export const iconLinksFromOtherTables: IconProps = { data: faCircleArrowLeft };
export const iconForwardSeparator: IconProps = { data: faSlash };
export const iconUrl: IconProps = { data: faLink };

// STATUSES

export const iconNotEditable: IconProps = { data: faLock };
export const iconUnsavedChanges: IconProps = { data: faCircleExclamation };

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
