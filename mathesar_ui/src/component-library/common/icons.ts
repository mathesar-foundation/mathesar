import {
  faQuestionCircle,
  faArrowLeft,
  faCheck,
  faExclamationTriangle,
  faSpinner,
  faAngleDown,
  faFile,
  faFileUpload,
  faTimes,
  faSearch,
  faAngleLeft,
  faEllipsisH,
  faAngleDoubleLeft,
  faAngleDoubleRight,
  faAngleRight,
  faCaretRight,
  faLightbulb,
  faGears,
  faArrowUpRightFromSquare,
  faCircleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import type { IconProps } from '@mathesar-component-library-dir/icon/IconTypes';

/**
 * @file
 *
 * - The "actions" and "things" classification is imperfect. Some icons will fit
 *   into both categories. That's okay. Use your best judgement when adding new
 *   ones.
 *
 */

// ACTIONS
//
// (These names should all be verbs)

export const iconCancel: IconProps = { data: faArrowLeft };
export const iconChooseItemManyAhead: IconProps = { data: faAngleDoubleRight };
export const iconChooseItemManyPrior: IconProps = { data: faAngleDoubleLeft };
export const iconChooseItemNext: IconProps = { data: faAngleRight };
export const iconChooseItemPrevious: IconProps = { data: faAngleLeft };
export const iconClose: IconProps = { data: faTimes };
export const iconExpandDown: IconProps = { data: faAngleDown };
export const iconHelp: IconProps = { data: faQuestionCircle };
export const iconProceed: IconProps = { data: faCheck };
export const iconSearch: IconProps = { data: faSearch };
export const iconShowMore: IconProps = { data: faEllipsisH };
export const iconUploadFile: IconProps = { data: faFileUpload };

// THINGS
//
// (These names should all be nouns)

export const iconFile: IconProps = { data: faFile };
export const iconSettings: IconProps = { data: faGears };
export const iconExternalLink: IconProps = { data: faArrowUpRightFromSquare };

// STATUSES

export const iconInfo: IconProps = { data: faLightbulb };
export const iconWarning: IconProps = { data: faCircleExclamation };
export const iconError: IconProps = { data: faExclamationTriangle };
export const iconLoading: IconProps = { data: faSpinner, spin: true };
export const iconSuccess: IconProps = { data: faCheck };
export const iconVerticallyCollapsed: IconProps = { data: faCaretRight };
