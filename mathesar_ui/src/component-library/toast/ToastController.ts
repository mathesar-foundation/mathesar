import { linear } from 'svelte/easing';
import type { Writable, Readable } from 'svelte/store';
import { writable, derived } from 'svelte/store';
import type { PauseableTweened } from '..';
import { pauseableTweened } from '..';

type ToastType = 'info' | 'success' | 'error';

/**
 * Allows control of the toast message after it is displayed
 */
interface ToastEntryController {
  progress: PauseableTweened,
  dismiss: () => void,
}

interface ToastEntryProps {
  title?: string,
  message?: string,
  type: ToastType,
  /**
   * The time (ms) the toast message will stay open. Or, the easing duration
   * used when manually changing the progress indicator.
   */
  duration: number,
  /**
   * When true, the progress bar will display.
   */
  hasProgress: boolean,
  /**
   * When true, the auto-close behavior will be paused while the user hovers on
   * the toast message.
   */
  allowPause: boolean,
  /**
   * When true, the toast message will provide a close button for the user to
   * dismiss the message. When false, the toast message can still be dismissed
   * via its controller.
   */
  allowDismiss: boolean,
  /**
   * This function will run when the toast item is shown.
   *
   * With the default props, this function will transition the progress
   * indicator from 100% to 0% and then dismiss the toast message. You can
   * override this behavior by supplying your own function here. For example,
   * passing `() => {}` will disable automatic movement of the progress
   * indicator and disable automatic closing of the toast message.
   */
  onShow: (c: ToastEntryController) => void,
  /**
   * This function will run when the toast item closes (either manually or
   * automatically).
   */
  onDismiss: () => void,
}

const baseDefaultProps: ToastEntryProps = {
  type: 'info',
  duration: 6000,
  hasProgress: true,
  allowPause: true,
  allowDismiss: true,
  onShow: (c) => c.progress.set(0).then(c.dismiss),
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
    const progress = pauseableTweened(1, { duration: props.duration, easing: linear });
    const controller: ToastEntryController = { progress, dismiss };
    const entry: ToastEntry = { id, props, controller };
    this.entriesMap.update((entries) => {
      const map = new Map(entries);
      map.set(id, entry);
      return map;
    });
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
