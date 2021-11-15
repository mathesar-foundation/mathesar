import { faCheck, IconDefinition, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { linear } from 'svelte/easing';
import type { Writable, Readable } from 'svelte/store';
import { writable, derived } from 'svelte/store';
import type { PauseableTweened } from '../common/utils/pauseableTweened';
import { pauseableTweened } from '../common/utils/pauseableTweened';
import type { IconFlip, IconRotate } from '../icon/Icon.d';

/**
 * Allows control of the toast message after it is displayed
 */
interface ToastEntryController {
  progress: PauseableTweened,
  dismiss: () => void,
}

interface Icon {
  data: IconDefinition,
  spin?: boolean,
  flip?: IconFlip,
  rotate?: IconRotate,
}

interface ToastEntryProps {
  title?: string,
  message?: string,
  icon?: Icon,
  backgroundColor: string,
  textColor: string,
  progressColor: string,
  /**
   * The time (ms) the toast message will stay open. When 0, the toast will not
   * auto-close.
   */
  lifetime: number,
  /**
   * When true, the toast message will provide a close button for the user to
   * dismiss the message. When false, the toast message can still be dismissed
   * via its controller.
   */
  allowDismiss: boolean,
  /**
   * When true, the progress bar will display.
   */
  hasProgress: boolean,
  /**
   * The value of the progress indicator when the toast message first appears.
   * Should be between 0 and 1.
   */
  initialProgress: number,
  /**
   * The value of the progress indicator immediately before the toast message
   * closes. Should be between 0 and 1.
   */
  finalProgress: number,
  /**
   * When true, the auto-close behavior will be paused while the user hovers on
   * the toast message.
   */
  allowPause: boolean,
  /**
   * This function will run when the toast item is shown. The toast controller
   * is passed to the function.
   */
  onShow: (c: ToastEntryController) => void,
  /**
   * This function will run when the toast item closes (either manually or
   * automatically).
   */
  onDismiss: () => void,
}

const baseDefaultProps: ToastEntryProps = {
  backgroundColor: 'rgba(77, 77, 77, 0.9)',
  textColor: 'white',
  progressColor: 'rgba(0, 0, 0, 0.5)',
  lifetime: 6000,
  hasProgress: true,
  initialProgress: 1,
  finalProgress: 0,
  allowPause: true,
  allowDismiss: true,
  onShow: () => {},
  onDismiss: () => {},
};

export interface ToastEntry {
  id: number,
  props: ToastEntryProps,
  controller: ToastEntryController,
}

export class ToastController {
  private maxId = 0;

  private defaultProps: ToastEntryProps;

  /**
   * We need read/write access to `entries` privately, but read-only access
   * publicly. That's why we have private `entriesMap` and public `entries`.
   */
  private entriesMap: Writable<Map<number, ToastEntry>>;

  entries: Readable<ToastEntry[]>;

  constructor({
    defaultProps,
  }: {
    defaultProps: Partial<ToastEntryProps>,
  } = { defaultProps: {} }) {
    this.entriesMap = writable<Map<number, ToastEntry>>(new Map());
    this.defaultProps = { ...baseDefaultProps, ...defaultProps };
    this.entries = derived(this.entriesMap, (entriesMap) => [...entriesMap.values()]);
  }

  show(partialProps: Partial<ToastEntryProps> = {}): ToastEntryController {
    const props = { ...this.defaultProps, ...partialProps };
    const id = this.maxId + 1;
    this.maxId = id;
    const dismiss = () => this.dismiss(id);
    const progress = pauseableTweened(
      props.initialProgress,
      { duration: 100, easing: linear },
    );
    const controller: ToastEntryController = { progress, dismiss };
    const entry: ToastEntry = { id, props, controller };
    this.entriesMap.update((entries) => {
      const map = new Map(entries);
      map.set(id, entry);
      return map;
    });
    if (props.lifetime) {
      void controller.progress.set(props.finalProgress, { duration: props.lifetime })
        .then(controller.dismiss);
    }
    props.onShow(controller);
    return controller;
  }

  private dismiss(id: number) {
    this.entriesMap.update((entriesMap) => {
      const entry = entriesMap.get(id);
      if (!entry) {
        return entriesMap;
      }
      const newEntriesMap = new Map(entriesMap);
      newEntriesMap.delete(id);
      entry.props.onDismiss();
      return newEntriesMap;
    });
  }
}

export type ToastShowFn = (p: Partial<ToastEntryProps>) => ToastEntryController;

interface DefaultMakeToast {
  entries: Readable<ToastEntry[]>,
  info: ToastShowFn,
  success: ToastShowFn,
  error: ToastShowFn,
}

export function makeToast(): DefaultMakeToast {
  const controller = new ToastController();
  return {
    entries: controller.entries,

    info(partialProps: Partial<ToastEntryProps> = {}) {
      return controller.show(partialProps);
    },

    success(partialProps: Partial<ToastEntryProps> = {}) {
      return controller.show({
        ...partialProps,
        icon: { data: faCheck },
        backgroundColor: 'rgba(92, 159, 84, 0.9)',
      });
    },

    error(partialProps: Partial<ToastEntryProps> = {}) {
      return controller.show({
        ...partialProps,
        icon: { data: faExclamationTriangle },
        backgroundColor: 'rgba(159, 86, 77, 0.9)',
      });
    },
  };
}
