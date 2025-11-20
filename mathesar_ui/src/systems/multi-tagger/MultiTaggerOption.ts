import type { ResultValue } from '@mathesar/api/rpc/records';

export class MultiTaggerOption {
  readonly key: ResultValue;

  readonly summary: string;

  readonly loading: boolean;

  readonly mappingId?: ResultValue;

  readonly checked: boolean;

  constructor(p: {
    key: ResultValue;
    summary: string;
    mappingId?: ResultValue;
    loading?: boolean;
  }) {
    this.key = p.key;
    this.summary = p.summary;
    this.loading = p.loading ?? false;
    this.mappingId = p.mappingId;
    this.checked = p.mappingId !== undefined;
  }

  withMapping(mappingId: ResultValue): MultiTaggerOption {
    return new MultiTaggerOption({ ...this, mappingId });
  }

  withoutMapping(): MultiTaggerOption {
    return new MultiTaggerOption({ ...this, mappingId: undefined });
  }

  asLoading(): MultiTaggerOption {
    return new MultiTaggerOption({ ...this, loading: true });
  }

  asNotLoading(): MultiTaggerOption {
    return new MultiTaggerOption({ ...this, loading: false });
  }
}
