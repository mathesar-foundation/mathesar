import { type Readable, type Updater, get, writable } from 'svelte/store';

import type { RawDataFormField } from '@mathesar/api/rpc/forms';

import type { DataFormStructureCtx } from '../DataFormStructure';

import type { FormFields } from './FormFields';

export interface AbstractFieldProps {
  key: RawDataFormField['key'];
  label: RawDataFormField['label'];
  help: RawDataFormField['help'];
  index: RawDataFormField['index'];
  styling: RawDataFormField['styling'];
}

export type AbstractFieldModifiableProps = keyof Pick<
  AbstractFieldProps,
  'index' | 'label' | 'help' | 'styling'
>;

export abstract class AbstractField {
  readonly container: FormFields;

  readonly key;

  readonly structureCtx: DataFormStructureCtx;

  private _index;

  get index(): Readable<AbstractFieldProps['index']> {
    return this._index;
  }

  private _label;

  get label(): Readable<AbstractFieldProps['label']> {
    return this._label;
  }

  private _help;

  get help(): Readable<AbstractFieldProps['help']> {
    return this._help;
  }

  private _styling;

  get styling(): Readable<AbstractFieldProps['styling']> {
    return this._styling;
  }

  readonly canDelete: boolean = true;

  constructor(
    container: FormFields,
    props: AbstractFieldProps,
    structureCtx: DataFormStructureCtx,
  ) {
    this.container = container;
    this.structureCtx = structureCtx;
    this.key = props.key;
    this._index = writable(props.index);
    this._label = writable(props.label);
    this._help = writable(props.help);
    this._styling = writable(props.styling);
  }

  setLabel(label: string) {
    this._label.set(label);
    this.triggerChangeEvent('label');
  }

  setHelpText(help: string | null) {
    this._help.set(help);
    this.triggerChangeEvent('help');
  }

  updateIndex(updator: Updater<number>) {
    this._index.update(updator);
    this.triggerChangeEvent('index');
  }

  updateStyling(styling: Partial<AbstractFieldProps['styling']>) {
    this._styling.update((s) => {
      if (styling === null) {
        return styling;
      }
      return {
        ...(s || {}),
        ...styling,
      };
    });
    this.triggerChangeEvent('styling');
  }

  protected abstract triggerChangeEvent<T extends AbstractFieldModifiableProps>(
    e: T,
  ): unknown;

  abstract checkAndSetDefaultLabel(): void;

  abstract toRawEphemeralField(options?: unknown): RawDataFormField;

  protected getBaseFieldRawJson() {
    return {
      key: this.key,
      index: get(this.index),
      label: get(this.label),
      help: get(this.help),
      styling: get(this.styling),
    };
  }
}
