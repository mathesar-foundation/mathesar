import { type Writable, get, writable } from 'svelte/store';

import type { EdfUpdateDiff, EphemeralDataForm } from './EphemeralDataForm';

export class DataFormManager {
  ephemeralDataForm: Writable<EphemeralDataForm>;

  constructor(ephemeralDataForm: EphemeralDataForm) {
    this.ephemeralDataForm = writable(ephemeralDataForm);
  }

  getEdf() {
    return get(this.ephemeralDataForm);
  }

  async update(
    callback: (edf: EphemeralDataForm) => EdfUpdateDiff,
  ): Promise<void> {
    const { data } = callback(this.getEdf());
    this.ephemeralDataForm.set(data);
  }
}
