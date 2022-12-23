import type { IconProps } from '@mathesar-component-library-dir/icon/IconTypes';
import type { SvelteComponent } from 'svelte';
import { linear } from 'svelte/easing';
import type { Writable, Readable } from 'svelte/store';
import { writable, derived } from 'svelte/store';
import type { PauseableTweened } from '@mathesar-component-library-dir/common/utils/pauseableTweened';
import { pauseableTweened } from '@mathesar-component-library-dir/common/utils/pauseableTweened';
import {
  iconSuccess,
  iconLoading,
  iconError,
  iconInfo,
} from '@mathesar-component-library-dir/common/icons';

/**
 * Allows control of the toast message after it is displayed
 */
interface ToastEntryController {
  id: number;
  progress: PauseableTweened;
  dismiss: () => void;
}

interface ToastEntryProps {
  /**
   * When given, the new toast message will replace an existing toast message
   * with the specified id.
   */
  id?: number;
  title?: Readable<string> | string;
  message?: Readable<string> | string;
  /**
   * If provided, will be used in place of `title` and `message`.
   */
  contentComponent?: typeof SvelteComponent;
  contentComponentProps?:
    | Readable<Record<string, unknown>>
    | Record<string, unknown>;
  icon?: Readable<IconProps> | IconProps;
  backgroundColor: Readable<string> | string;
  textColor: Readable<string> | string;
  progressColor: Readable<string> | string;
  /**
   * The time (ms) the toast message will stay open. When 0, the toast will not
   * auto-close.
   */
  lifetime: number;
  /**
   * When true, the toast message will provide a close button for the user to
   * dismiss the message. When false, the toast message can still be dismissed
   * via its controller.
   */
  allowDismiss: boolean;
  /**
   * When true, the progress bar will display.
   */
  hasProgress: boolean;
  /**
   * The value of the progress indicator when the toast message first appears.
   * Should be between 0 and 1.
   */
  initialProgress: number;
  /**
   * The value of the progress indicator immediately before the toast message
   * closes. Should be between 0 and 1.
   */
  finalProgress: number;
  /**
   * When true, the auto-close behavior will be paused while the user hovers on
   * the toast message.
   */
  allowPause: boolean;
  /**
   * This function will run when the toast item is shown. The toast controller
   * is passed to the function.
   */
  onShow: (c: ToastEntryController) => void;
  /**
   * This function will run when the toast item closes (either manually or
   * automatically).
   */
  onDismiss: () => void;
}

const baseDefaultProps: ToastEntryProps = {
  backgroundColor: 'var(--sky-500)',
  textColor: 'var(--slate-800)',
  progressColor: 'rgba(255, 255, 255, 0.6)',
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
  id: number;
  props: ToastEntryProps;
  controller: ToastEntryController;
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

  constructor(
    {
      defaultProps,
    }: {
      defaultProps: Partial<ToastEntryProps>;
    } = { defaultProps: {} },
  ) {
    this.entriesMap = writable<Map<number, ToastEntry>>(new Map());
    this.defaultProps = { ...baseDefaultProps, ...defaultProps };
    this.entries = derived(this.entriesMap, (entriesMap) => [
      ...entriesMap.values(),
    ]);
  }

  private makeId() {
    this.maxId += 1;
    return this.maxId;
  }

  show(partialProps: Partial<ToastEntryProps> = {}): ToastEntryController {
    const props = { ...this.defaultProps, ...partialProps };
    const id = props.id ?? this.makeId();
    const dismiss = () => this.dismiss(id);
    const progress = pauseableTweened(props.initialProgress, {
      duration: 200,
      easing: linear,
    });
    const controller: ToastEntryController = { id, progress, dismiss };
    const entry: ToastEntry = { id, props, controller };
    this.entriesMap.update((entries) => {
      const map = new Map(entries);
      map.set(id, entry);
      return map;
    });
    if (props.lifetime) {
      void controller.progress
        .set(props.finalProgress, { duration: props.lifetime })
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

export type ToastDetail = Partial<ToastEntryProps> | string;
export type ToastShowFn = (d: ToastDetail) => ToastEntryController;

interface MakeToast {
  entries: Readable<ToastEntry[]>;
  info: ToastShowFn;
  success: ToastShowFn;
  error: ToastShowFn;
  fromError: (error?: unknown) => ToastEntryController;
  spinner: ToastShowFn;
  progress: ToastShowFn;
}

export function makeToastProps(detail: ToastDetail): Partial<ToastEntryProps> {
  if (typeof detail === 'string') {
    return { title: detail };
  }
  return detail;
}

export function makeToast(
  defaultProps: Partial<ToastEntryProps> = {},
): MakeToast {
  const controller = new ToastController({ defaultProps });

  function info(detail: ToastDetail = {}) {
    return controller.show(
      makeToastProps({
        icon: iconInfo,
        ...makeToastProps(detail),
      }),
    );
  }

  function success(detail: ToastDetail = {}) {
    return controller.show({
      icon: iconSuccess,
      backgroundColor: 'var(--green-100)',
      ...makeToastProps(detail),
    });
  }

  function error(detail: ToastDetail = {}) {
    return controller.show({
      icon: iconError,
      backgroundColor: 'var(--red-100)',
      ...makeToastProps(detail),
    });
  }

  function fromError(err?: unknown) {
    return error(err instanceof Error ? err.message : 'Something went wrong.');
  }

  function spinner(detail: ToastDetail = {}) {
    return controller.show({
      icon: { ...iconLoading },
      lifetime: 0,
      allowDismiss: false,
      hasProgress: false,
      ...makeToastProps(detail),
    });
  }

  function progress(detail: ToastDetail = {}) {
    return controller.show({
      lifetime: 0,
      allowDismiss: false,
      initialProgress: 0,
      ...makeToastProps(detail),
    });
  }

  return {
    entries: controller.entries,
    info,
    success,
    error,
    fromError,
    spinner,
    progress,
  };
}
